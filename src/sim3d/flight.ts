import type { Building } from './arena';

export const STEP = 1 / 60;
export const MAX_STEPS = 5;
export const MAX_FRAME_DELTA = 0.25;

export type Outcome = 'running' | 'won' | 'lost';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FlyInput {
  /** Yaw right (+) / left (-), -1..1. Positive turns to screen-right. */
  turn: number;
  /** Descend (-) / climb (+), -1..1. */
  climb: number;
  boost: boolean;
  sting: boolean;
}

export interface Tuning {
  arenaRadius: number;
  minAltitude: number;
  maxAltitude: number;
  runSeconds: number;
  player: {
    speed: number;
    boost: number;
    yawRate: number;
    pitchLimit: number;
    radius: number;
    lives: number;
    invulnFrames: number;
  };
  sting: { range: number; cooldownFrames: number; damage: number };
  foe: { hp: number; radius: number; speed: number; score: number };
  pools: { foes: number };
  waves: { intervalSeconds: number; count: number };
}

export interface Player {
  pos: Vec3;
  yaw: number;
  pitch: number;
  alive: boolean;
  invulnFrames: number;
  cooldownFrames: number;
}

export interface Foe {
  alive: boolean;
  pos: Vec3;
  vel: Vec3;
  hp: number;
  radius: number;
  score: number;
}

export interface World {
  tuning: Tuning;
  seed: number;
  rng: number;
  tick: number;
  runFrames: number;
  runFramesMax: number;
  score: number;
  lives: number;
  waveTimer: number;
  player: Player;
  foes: Foe[];
  solids: Building[];
  outcome: Outcome;
}

function emptyFoe(): Foe {
  return {
    alive: false,
    pos: { x: 0, y: -100, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    hp: 0,
    radius: 0,
    score: 0
  };
}

export function createWorld(seed: number, tuning: Tuning, solids: Building[] = []): World {
  return {
    tuning,
    seed,
    rng: (seed >>> 0) || 0x9e3779b9,
    tick: 0,
    runFrames: 0,
    runFramesMax: Math.round(tuning.runSeconds * 60),
    score: 0,
    lives: tuning.player.lives,
    waveTimer: 0,
    outcome: 'running',
    player: {
      pos: { x: 0, y: 8, z: 0 },
      yaw: 0,
      pitch: 0,
      alive: true,
      invulnFrames: 0,
      cooldownFrames: 0
    },
    foes: Array.from({ length: tuning.pools.foes }, emptyFoe),
    solids
  };
}

/** Deterministic PRNG. State lives in the world so replays agree. */
export function nextRandom(world: World): number {
  world.rng = (world.rng + 0x6d2b79f5) >>> 0;
  let t = world.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function spawnFoe(world: World, x: number, y: number, z: number): Foe | null {
  const slot = world.foes.find((foe) => !foe.alive);
  if (!slot) return null;
  slot.alive = true;
  slot.pos.x = x;
  slot.pos.y = y;
  slot.pos.z = z;
  slot.vel.x = 0;
  slot.vel.y = 0;
  slot.vel.z = 0;
  slot.hp = world.tuning.foe.hp;
  slot.radius = world.tuning.foe.radius;
  slot.score = world.tuning.foe.score;
  return slot;
}

function forward(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: Math.sin(pitch), z: Math.cos(yaw) * cp };
}

function dist3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function stepPlayer(world: World, input: FlyInput): void {
  const { player, tuning } = world;

  player.yaw -= clamp(input.turn, -1, 1) * tuning.player.yawRate * STEP;
  player.pitch = clamp(
    player.pitch + clamp(input.climb, -1, 1) * 1.6 * STEP,
    -tuning.player.pitchLimit,
    tuning.player.pitchLimit
  );

  const speed = tuning.player.speed + (input.boost ? tuning.player.boost : 0);
  const dir = forward(player.yaw, player.pitch);
  player.pos.x += dir.x * speed * STEP;
  player.pos.y += dir.y * speed * STEP;
  player.pos.z += dir.z * speed * STEP;

  player.pos.y = clamp(player.pos.y, tuning.minAltitude, tuning.maxAltitude);

  const r = Math.hypot(player.pos.x, player.pos.z);
  if (r > tuning.arenaRadius) {
    player.pos.x *= tuning.arenaRadius / r;
    player.pos.z *= tuning.arenaRadius / r;
  }

  for (const solid of world.solids) {
    if (player.pos.y > solid.h + tuning.player.radius) continue;
    const dx = player.pos.x - solid.x;
    const dz = player.pos.z - solid.z;
    const reach = solid.r + tuning.player.radius;
    const dist = Math.hypot(dx, dz);
    if (dist >= reach || dist === 0) continue;
    player.pos.x = solid.x + (dx / dist) * reach;
    player.pos.z = solid.z + (dz / dist) * reach;
  }

  if (player.invulnFrames > 0) player.invulnFrames--;
  if (player.cooldownFrames > 0) player.cooldownFrames--;

  if (input.sting && player.cooldownFrames <= 0) {
    let best: Foe | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const foe of world.foes) {
      if (!foe.alive) continue;
      const d = dist3(foe.pos, player.pos);
      if (d < bestDistance) {
        best = foe;
        bestDistance = d;
      }
    }
    if (best && bestDistance <= tuning.sting.range) {
      best.hp -= tuning.sting.damage;
      if (best.hp <= 0) {
        best.alive = false;
        world.score += best.score;
      }
    }
    player.cooldownFrames = tuning.sting.cooldownFrames;
  }
}

function stepFoes(world: World): void {
  const { player, tuning } = world;
  for (const foe of world.foes) {
    if (!foe.alive) continue;
    const dx = player.pos.x - foe.pos.x;
    const dy = player.pos.y - foe.pos.y;
    const dz = player.pos.z - foe.pos.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const speed = tuning.foe.speed;
    foe.pos.x += (dx / d) * speed * STEP;
    foe.pos.y += (dy / d) * speed * STEP;
    foe.pos.z += (dz / d) * speed * STEP;
  }
}

function collide(world: World): void {
  const { player, tuning } = world;
  if (!player.alive || player.invulnFrames > 0) return;

  for (const foe of world.foes) {
    if (!foe.alive) continue;
    if (dist3(foe.pos, player.pos) > tuning.player.radius + foe.radius) continue;

    foe.alive = false;
    world.lives--;
    player.invulnFrames = tuning.player.invulnFrames;
    if (world.lives <= 0) {
      world.lives = 0;
      player.alive = false;
      world.outcome = 'lost';
    }
    break;
  }
}

function stepWaves(world: World): void {
  world.waveTimer++;
  const interval = Math.max(1, Math.round(world.tuning.waves.intervalSeconds * 60));
  if (world.waveTimer < interval) return;
  world.waveTimer = 0;

  for (let i = 0; i < world.tuning.waves.count; i++) {
    const angle = nextRandom(world) * Math.PI * 2;
    const radius = world.tuning.arenaRadius * (0.5 + nextRandom(world) * 0.4);
    spawnFoe(
      world,
      Math.cos(angle) * radius,
      world.tuning.minAltitude + nextRandom(world) * 12,
      Math.sin(angle) * radius
    );
  }
}

export function stepWorld(world: World, input: FlyInput): void {
  if (world.outcome !== 'running') return;

  world.tick++;
  stepPlayer(world, input);
  stepFoes(world);
  stepWaves(world);
  collide(world);

  world.runFrames++;
  if (world.outcome === 'running' && world.runFrames >= world.runFramesMax) {
    world.player.alive = false;
    world.outcome = 'won';
  }
}

export interface AdvanceResult {
  acc: number;
  steps: number;
}

/** Fixed-step accumulator, clamped so a stalled tab cannot fast-forward. */
export function advance(world: World, input: FlyInput, dt: number, acc: number): AdvanceResult {
  const maxSteps = MAX_STEPS;
  let next = Math.min(acc + Math.max(0, dt), MAX_FRAME_DELTA);
  let steps = 0;

  while (next >= STEP && steps < maxSteps) {
    stepWorld(world, input);
    next -= STEP;
    steps++;
  }

  return { acc: next, steps };
}

const OUTCOME_CODE: Record<Outcome, number> = { running: 0, won: 1, lost: 2 };

/** Replay/render independent fingerprint used by determinism tests. */
export function hashWorld(world: World): string {
  const q = (value: number) => Math.round(value * 1000);
  const parts: number[] = [
    world.tick,
    world.runFrames,
    world.score,
    world.lives,
    world.rng,
    OUTCOME_CODE[world.outcome],
    world.player.alive ? 1 : 0,
    q(world.player.pos.x),
    q(world.player.pos.y),
    q(world.player.pos.z),
    q(world.player.yaw),
    q(world.player.pitch),
    world.player.invulnFrames,
    world.player.cooldownFrames,
    world.waveTimer
  ];

  for (const foe of world.foes) {
    parts.push(
      foe.alive ? 1 : 0,
      q(foe.pos.x),
      q(foe.pos.y),
      q(foe.pos.z),
      foe.hp
    );
  }

  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash ^= part | 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
