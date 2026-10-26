import {
  MAX_FRAME_DELTA,
  MAX_STEPS,
  STEP,
  createWorld,
  hashWorld,
  spawnFoe,
  stepWorld,
  type FlyInput,
  type Vec3,
  type World
} from './flight';
import { buildArenaLayout } from './arena';
import {
  buildTuning,
  type ChapterDef,
  type HazardDef,
  type ObjectiveDef,
  type Vec3Data
} from '../content3';
import type { Building } from './arena';

export type StoryPhase = 'playing' | 'complete';

export type StoryEvent =
  | { type: 'card'; id: string }
  | { type: 'objective'; id: string; index: number }
  | { type: 'shard'; id: string; pos: Vec3 }
  | { type: 'write'; count: number }
  | { type: 'node'; index: number; kind: 'sabotage' | 'boss' }
  | { type: 'hurt'; lives: number }
  | { type: 'respawn'; pos: Vec3 }
  | { type: 'sting'; pos: Vec3 }
  | { type: 'kill'; pos: Vec3 }
  | { type: 'complete' };

export interface HazardRuntime {
  x: number;
  y: number;
  z: number;
  active: boolean;
}

export interface ActorRuntime {
  id: string;
  x: number;
  y: number;
  z: number;
  pathIndex: number;
  done: boolean;
}

export interface StoryState {
  chapter: ChapterDef;
  world: World;
  objectiveIndex: number;
  objectiveProgress: number;
  objectiveStartedAt: number;
  shards: Record<string, boolean>;
  paranoia: number;
  checkpoint: Vec3;
  lives: number;
  deaths: number;
  elapsed: number;
  events: StoryEvent[];
  phase: StoryPhase;
  hazards: HazardRuntime[];
  actors: ActorRuntime[];
  waveFired: boolean[];
  writeIndex: number;
  interactCooldown: number;
  midTriggered: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function copyVec(vec: Vec3): Vec3 {
  return { x: vec.x, y: vec.y, z: vec.z };
}

function dist(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function storySolids(chapter: ChapterDef): Building[] {
  const base = chapter.layout === 'city' ? buildArenaLayout(chapter.layoutSeed ?? 7) : [];
  return [...base, ...(chapter.solids ?? [])];
}

export function createStoryState(seed: number, chapter: ChapterDef): StoryState {
  const tuning = buildTuning(chapter);
  const world = createWorld(seed, tuning, storySolids(chapter));
  world.player.pos = copyVec(chapter.spawn.pos);
  world.player.yaw = chapter.spawn.yaw;
  world.player.pitch = 0;
  world.lives = tuning.player.lives;

  const shards: Record<string, boolean> = {};
  for (const shard of chapter.shards ?? []) shards[shard.id] = false;

  const state: StoryState = {
    chapter,
    world,
    objectiveIndex: 0,
    objectiveProgress: 0,
    objectiveStartedAt: 0,
    shards,
    paranoia: 0,
    checkpoint: copyVec(chapter.spawn.pos),
    lives: tuning.player.lives,
    deaths: 0,
    elapsed: 0,
    events: [],
    phase: 'playing',
    hazards: (chapter.hazards ?? []).map((hazard) => ({
      x: hazard.pos.x,
      y: hazard.pos.y,
      z: hazard.pos.z,
      active: false
    })),
    actors: (chapter.actors ?? []).map((actor) => ({
      id: actor.id,
      x: actor.path[0]?.x ?? 0,
      y: actor.path[0]?.y ?? 0,
      z: actor.path[0]?.z ?? 0,
      pathIndex: 0,
      done: false
    })),
    waveFired: (chapter.waves ?? []).map(() => false),
    writeIndex: 0,
    interactCooldown: 0,
    midTriggered: false
  };

  for (let i = 0; i < (chapter.waves ?? []).length; i++) {
    const wave = chapter.waves![i];
    if (wave.atParanoia !== undefined || wave.atSeconds > 0) continue;
    fireWave(state, i);
  }

  const intro = chapter.cards.find((card) => card.at === 'intro');
  if (intro) state.events.push({ type: 'card', id: intro.id });

  return state;
}

function fireWave(state: StoryState, index: number): void {
  const waves = state.chapter.waves ?? [];
  const wave = waves[index];
  if (!wave || state.waveFired[index]) return;
  state.waveFired[index] = true;
  for (let i = 0; i < wave.count; i++) {
    const base = wave.pos ?? {
      x: state.world.player.pos.x + 24,
      y: state.world.player.pos.y + 4,
      z: state.world.player.pos.z - 24
    };
    spawnFoe(state.world, base.x + i * 3, base.y, base.z);
  }
}

export function currentObjective(state: StoryState): ObjectiveDef | undefined {
  return state.chapter.objectives[state.objectiveIndex];
}

export function actorPosition(state: StoryState, id: string): Vec3 | null {
  const actor = state.actors.find((candidate) => candidate.id === id);
  return actor ? { x: actor.x, y: actor.y, z: actor.z } : null;
}

/** Resolve the live world position an objective points at (actor-relative if needed). */
export function targetPosition(
  state: StoryState,
  objective: ObjectiveDef,
  index = 0
): Vec3Data | null {
  switch (objective.kind) {
    case 'reach':
      return objective.actorId ? actorPosition(state, objective.actorId) : objective.target ?? null;
    case 'escort':
      return objective.actorId ? actorPosition(state, objective.actorId) : null;
    case 'write': {
      const mark = objective.marks?.[index];
      if (!mark) return null;
      const base = objective.actorId ? actorPosition(state, objective.actorId) : { x: 0, y: 0, z: 0 };
      if (!base) return null;
      return { x: base.x + mark.x, y: base.y + mark.y, z: base.z + mark.z };
    }
    case 'sabotage':
    case 'boss':
      return objective.targets?.[index] ?? null;
    case 'collect': {
      const shard = (state.chapter.shards ?? []).find((candidate) => !state.shards[candidate.id]);
      return shard?.pos ?? null;
    }
    case 'destroy': {
      const foe = state.world.foes.find((candidate) => candidate.alive);
      return foe?.pos ?? null;
    }
    default:
      return null;
  }
}

function completeObjective(state: StoryState): void {
  const objective = currentObjective(state);
  if (!objective) return;
  state.events.push({ type: 'objective', id: objective.id, index: state.objectiveIndex });
  state.objectiveIndex++;
  state.objectiveProgress = 0;
  state.objectiveStartedAt = state.elapsed;

  if (state.objectiveIndex >= state.chapter.objectives.length) {
    state.phase = 'complete';
    state.events.push({ type: 'complete' });
    const outro = state.chapter.cards.find((card) => card.at === 'outro');
    if (outro) state.events.push({ type: 'card', id: outro.id });
    return;
  }

  state.writeIndex = 0;

  if (!state.midTriggered && state.objectiveIndex >= Math.floor(state.chapter.objectives.length / 2)) {
    state.midTriggered = true;
    const mid = state.chapter.cards.find((card) => card.at === 'mid');
    if (mid) state.events.push({ type: 'card', id: mid.id });
  }
}

function objectiveDone(state: StoryState, objective: ObjectiveDef): boolean {
  switch (objective.kind) {
    case 'reach': {
      const target = targetPosition(state, objective);
      if (!target) return false;
      return dist(state.world.player.pos, target) <= (objective.radius ?? 2);
    }
    case 'escort': {
      const target = targetPosition(state, objective);
      if (!target) return false;
      if (dist(state.world.player.pos, target) <= (objective.radius ?? 10)) {
        state.objectiveProgress += STEP;
      } else {
        state.objectiveProgress = Math.max(0, state.objectiveProgress - STEP * 0.5);
      }
      return state.objectiveProgress >= (objective.seconds ?? 0);
    }
    case 'collect': {
      const ids = objective.shardIds ?? [];
      const found = ids.filter((id) => state.shards[id]).length;
      state.objectiveProgress = found;
      return ids.length > 0 && found === ids.length;
    }
    case 'survive': {
      state.objectiveProgress = state.elapsed - state.objectiveStartedAt;
      return state.objectiveProgress >= (objective.seconds ?? 0);
    }
    case 'write':
      return state.writeIndex >= (objective.marks?.length ?? 0);
    case 'sabotage':
    case 'boss':
      return state.objectiveProgress >= (objective.count ?? 1);
    case 'destroy':
      return state.objectiveProgress >= (objective.count ?? 1);
    default:
      return false;
  }
}

function stepActors(state: StoryState): void {
  for (const actor of state.actors) {
    const def = state.chapter.actors?.find((candidate) => candidate.id === actor.id);
    if (!def || actor.done) continue;
    const next = def.path[actor.pathIndex + 1];
    if (!next) {
      actor.done = true;
      continue;
    }
    const dx = next.x - actor.x;
    const dy = next.y - actor.y;
    const dz = next.z - actor.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const travel = def.speed * STEP;
    if (distance <= travel) {
      actor.x = next.x;
      actor.y = next.y;
      actor.z = next.z;
      actor.pathIndex++;
      if (actor.pathIndex >= def.path.length - 1) actor.done = true;
    } else {
      actor.x += (dx / distance) * travel;
      actor.y += (dy / distance) * travel;
      actor.z += (dz / distance) * travel;
    }
  }
}

function stepShards(state: StoryState): void {
  for (const shard of state.chapter.shards ?? []) {
    if (state.shards[shard.id]) continue;
    if (dist(state.world.player.pos, shard.pos) > 1.8) continue;
    state.shards[shard.id] = true;
    state.checkpoint = copyVec(shard.pos);
    state.events.push({ type: 'shard', id: shard.id, pos: copyVec(shard.pos) });
  }
}

function stepWrite(state: StoryState): void {
  const objective = currentObjective(state);
  if (!objective || objective.kind !== 'write') return;
  const mark = targetPosition(state, objective, state.writeIndex);
  if (!mark) return;
  if (dist(state.world.player.pos, mark) > (objective.radius ?? 2)) return;
  state.writeIndex++;
  state.objectiveProgress = state.writeIndex;
  state.events.push({ type: 'write', count: state.writeIndex });
}

function stepSabotage(state: StoryState, input: FlyInput): void {
  const objective = currentObjective(state);
  if (!objective || (objective.kind !== 'sabotage' && objective.kind !== 'boss')) return;
  if (!input.sting || state.interactCooldown > 0) return;
  const target = targetPosition(state, objective, state.writeIndex);
  if (!target) return;
  if (dist(state.world.player.pos, target) > (objective.radius ?? 4)) return;
  state.writeIndex++;
  state.objectiveProgress = state.writeIndex;
  state.interactCooldown = 30;
  if (objective.kind === 'sabotage') {
    state.paranoia = clamp(state.paranoia + 25, 0, 100);
  }
  state.events.push({ type: 'node', index: state.writeIndex, kind: objective.kind });
}

function damage(state: StoryState): void {
  if (state.world.player.invulnFrames > 0 || state.phase !== 'playing') return;
  state.world.lives--;
  state.lives = state.world.lives;
  state.world.player.invulnFrames = state.world.tuning.player.invulnFrames;
  state.events.push({ type: 'hurt', lives: state.lives });
  if (state.world.lives <= 0) respawn(state);
}

function respawn(state: StoryState): void {
  state.deaths++;
  state.world.lives = state.world.tuning.player.lives;
  state.lives = state.world.tuning.player.lives;
  state.world.player.pos = copyVec(state.checkpoint);
  state.world.player.alive = true;
  state.world.player.invulnFrames = state.world.tuning.player.invulnFrames;
  state.world.outcome = 'running';
  state.events.push({ type: 'respawn', pos: copyVec(state.checkpoint) });
}

function hazardPosition(state: StoryState, hazard: HazardDef, out: HazardRuntime): void {
  out.x = hazard.pos.x;
  out.y = hazard.pos.y;
  out.z = hazard.pos.z;
  out.active = false;

  if ((hazard.kind === 'swatter' || hazard.kind === 'tweezer') && hazard.path && hazard.path.length >= 2) {
    const period = Math.max(0.5, hazard.periodSeconds ?? 6);
    const cycle = state.elapsed % period;
    const t = cycle / period;
    const a = hazard.path[0];
    const b = hazard.path[1];
    out.x = lerp(a.x, b.x, t);
    out.y = lerp(a.y, b.y, t);
    out.z = lerp(a.z, b.z, t);
    out.active = cycle >= period - Math.max(0.1, hazard.activeSeconds ?? 1);
  }
}

function stepHazards(state: StoryState): void {
  const player = state.world.player.pos;
  const tuning = state.world.tuning;

  for (let i = 0; i < (state.chapter.hazards ?? []).length; i++) {
    const hazard = state.chapter.hazards![i];
    const runtime = state.hazards[i];
    if (hazard.activeAfterObjective !== undefined && state.objectiveIndex < hazard.activeAfterObjective) {
      runtime.active = false;
      continue;
    }
    hazardPosition(state, hazard, runtime);

    if (hazard.kind === 'wind') {
      const dx = player.x - hazard.pos.x;
      const dz = player.z - hazard.pos.z;
      const inColumn =
        Math.hypot(dx, dz) <= hazard.radius &&
        player.y >= hazard.pos.y - (hazard.height ?? 6) / 2 &&
        player.y <= hazard.pos.y + (hazard.height ?? 6) / 2;
      if (inColumn) {
        const dir = hazard.dir ?? { x: 1, y: 0.15, z: 0 };
        const strength = hazard.strength ?? 6;
        player.x += dir.x * strength * STEP;
        player.y += dir.y * strength * STEP;
        player.z += dir.z * strength * STEP;
      }
    } else if (hazard.kind === 'lamp' || hazard.kind === 'fire') {
      runtime.active = true;
      if (dist(player, hazard.pos) <= hazard.radius) damage(state);
    } else if (hazard.kind === 'smoke') {
      runtime.active = true;
    } else if (runtime.active) {
      const dx = player.x - runtime.x;
      const dy = player.y - runtime.y;
      const dz = player.z - runtime.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= hazard.radius + tuning.player.radius) {
        damage(state);
      }
    }
  }

  player.y = clamp(player.y, tuning.minAltitude, tuning.maxAltitude);
  const radius = Math.hypot(player.x, player.z);
  if (radius > tuning.arenaRadius) {
    player.x *= tuning.arenaRadius / radius;
    player.z *= tuning.arenaRadius / radius;
  }
}

export function stepStory(state: StoryState, input: FlyInput): void {
  if (state.phase !== 'playing') return;

  state.elapsed += STEP;
  state.paranoia = clamp(state.paranoia + STEP * 0.15, 0, 100);
  state.interactCooldown = Math.max(0, state.interactCooldown - 1);

  for (let i = 0; i < (state.chapter.waves ?? []).length; i++) {
    const wave = state.chapter.waves![i];
    if (state.waveFired[i]) continue;
    if (wave.atParanoia !== undefined) {
      if (state.paranoia >= wave.atParanoia) fireWave(state, i);
    } else if (state.elapsed >= wave.atSeconds) {
      fireWave(state, i);
    }
  }

  const scoreBefore = state.world.score;
  stepWorld(state.world, input);
  state.lives = state.world.lives;

  if (state.world.outcome === 'lost') {
    respawn(state);
  } else if (state.world.outcome === 'won') {
    state.world.outcome = 'running';
  }

  const kills = (state.world.score - scoreBefore) / Math.max(1, state.world.tuning.foe.score);
  if (kills > 0) {
    const objective = currentObjective(state);
    if (objective?.kind === 'destroy') state.objectiveProgress += kills;
    const foe = state.world.foes.find((candidate) => !candidate.alive);
    state.events.push({
      type: 'kill',
      pos: foe ? copyVec(foe.pos) : copyVec(state.world.player.pos)
    });
  }

  if (input.sting) {
    const objective = currentObjective(state);
    if (objective?.kind === 'destroy') {
      state.events.push({ type: 'sting', pos: copyVec(state.world.player.pos) });
    }
  }

  stepActors(state);
  stepShards(state);
  stepWrite(state);
  stepSabotage(state, input);
  stepHazards(state);

  let guard = 0;
  while (state.phase === 'playing' && state.objectiveIndex < state.chapter.objectives.length && guard++ < 16) {
    const objective = currentObjective(state);
    if (!objective || !objectiveDone(state, objective)) break;
    completeObjective(state);
  }
}

export interface StoryAdvanceResult {
  acc: number;
  steps: number;
}

/** Fixed-step accumulator for story mode. */
export function advanceStory(
  state: StoryState,
  input: FlyInput,
  dt: number,
  acc: number
): StoryAdvanceResult {
  let next = Math.min(acc + Math.max(0, dt), MAX_FRAME_DELTA);
  let steps = 0;
  while (next >= STEP && steps < MAX_STEPS && state.phase === 'playing') {
    stepStory(state, input);
    next -= STEP;
    steps++;
  }
  return { acc: next, steps };
}

export function consumeEvents(state: StoryState): StoryEvent[] {
  if (state.events.length === 0) return [];
  return state.events.splice(0, state.events.length);
}

export function collectedShardIds(state: StoryState): string[] {
  return Object.keys(state.shards).filter((id) => state.shards[id]);
}

export function totalShards(state: StoryState): number {
  return (state.chapter.shards ?? []).length;
}

const PHASE_CODE: Record<StoryPhase, number> = { playing: 0, complete: 1 };

/** Fingerprint for replay tests: flight world + story progress. */
export function hashStory(state: StoryState): string {
  const parts: number[] = [
    parseInt(hashWorld(state.world), 16),
    state.objectiveIndex,
    Math.round(state.objectiveProgress * 1000),
    Math.round(state.paranoia * 1000),
    Math.round(state.elapsed * 1000),
    state.lives,
    state.deaths,
    state.writeIndex,
    state.interactCooldown,
    PHASE_CODE[state.phase]
  ];

  for (const actor of state.actors) {
    parts.push(
      Math.round(actor.x * 1000),
      Math.round(actor.y * 1000),
      Math.round(actor.z * 1000),
      actor.pathIndex,
      actor.done ? 1 : 0
    );
  }

  for (const id of Object.keys(state.shards).sort()) {
    parts.push(state.shards[id] ? 1 : 0);
  }

  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash ^= part | 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
