import type { Building } from './arena';
import { resolveCircleBox } from './collision';

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
  /** Descend (-) / ascend (+), -1..1. */
  climb: number;
  /** Reverse (-) / forward (+), -1..1. Zero hovers. */
  throttle?: number;
  /** Edge press: perch or take off. */
  perch?: boolean;
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
    accel?: number;
    drag?: number;
    turnSmoothing?: number;
    rollLimit?: number;
    collisionLoss?: number;
    liftSpeed?: number;
  };
  sting: { range: number; cooldownFrames: number; damage: number };
  foe: { hp: number; radius: number; speed: number; score: number };
  pools: { foes: number };
  waves: { intervalSeconds: number; count: number };
}

export interface Player {
  pos: Vec3;
  vel: Vec3;
  speed: number;
  roll: number;
  smoothedTurn: number;
  smoothedClimb: number;
  smoothedThrottle: number;
  yaw: number;
  pitch: number;
  alive: boolean;
  invulnFrames: number;
  cooldownFrames: number;
  bumpCooldown: number;
  perched: boolean;
  perchY: number;
}

export interface Bump {
  x: number;
  y: number;
  z: number;
  strength: number;
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
  bumps: Bump[];
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
      vel: { x: 0, y: 0, z: 0 },
      speed: 0,
      roll: 0,
      smoothedTurn: 0,
      smoothedClimb: 0,
      smoothedThrottle: 0,
      yaw: 0,
      pitch: 0,
      alive: true,
      invulnFrames: 0,
      cooldownFrames: 0,
      bumpCooldown: 0,
      perched: false,
      perchY: 0
    },
    foes: Array.from({ length: tuning.pools.foes }, emptyFoe),
    solids,
    bumps: []
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

function pushBump(world: World, x: number, y: number, z: number, strength: number): void {
  world.bumps.push({ x, y, z, strength });
  if (world.bumps.length > 8) world.bumps.shift();
}

export function consumeBumps(world: World): Bump[] {
  if (world.bumps.length === 0) return [];
  return world.bumps.splice(0, world.bumps.length);
}

function trySting(world: World, input: FlyInput): void {
  const { player, tuning } = world;
  if (!input.sting || player.cooldownFrames > 0) return;
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

/** Nearest upward-facing surface the fly can settle on. */
function perchSurface(world: World): number | null {
  const { player, tuning } = world;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestY: number | null = null;

  if (player.pos.y <= tuning.minAltitude + 2.2) {
    bestDistance = Math.abs(player.pos.y - tuning.minAltitude);
    bestY = tuning.minAltitude;
  }

  for (const solid of world.solids) {
    if (player.pos.y < solid.h - 1) continue;
    const vertical = Math.abs(player.pos.y - solid.h);
    if (vertical > 2.5 || vertical >= bestDistance) continue;
    const c = Math.cos(solid.rot);
    const s = Math.sin(solid.rot);
    const dx = player.pos.x - solid.x;
    const dz = player.pos.z - solid.z;
    const lx = dx * c - dz * s;
    const lz = dx * s + dz * c;
    if (Math.abs(lx) <= solid.w / 2 + tuning.player.radius && Math.abs(lz) <= solid.d / 2 + tuning.player.radius) {
      bestDistance = vertical;
      bestY = solid.h;
    }
  }

  return bestY;
}

function tryPerch(world: World): boolean {
  const { player } = world;
  const surfaceY = perchSurface(world);
  if (surfaceY === null) return false;
  player.perched = true;
  player.perchY = surfaceY;
  player.pos.y = surfaceY + 0.35;
  player.speed = 0;
  player.vel.x = 0;
  player.vel.y = 0;
  player.vel.z = 0;
  player.pitch = 0;
  player.roll *= 0.5;
  return true;
}

function detach(world: World): void {
  const { player, tuning } = world;
  player.perched = false;
  player.pos.y = player.perchY + tuning.player.radius * 1.6;
  player.vel.y = 1.2;
  player.speed = 0;
}

function stepPlayer(world: World, input: FlyInput): void {
  const { player, tuning } = world;
  const p = tuning.player;
  const accel = p.accel ?? 26;
  const drag = p.drag ?? 7;
  const turnSmoothing = p.turnSmoothing ?? 10;
  const rollLimit = p.rollLimit ?? 0.55;
  const collisionLoss = p.collisionLoss ?? 0.72;
  const liftSpeed = p.liftSpeed ?? 3.4;

  const turnTarget = clamp(input.turn, -1, 1);
  const climbTarget = clamp(input.climb, -1, 1);
  const throttleTarget = clamp(input.throttle ?? 0, -1, 1);
  const smooth = 1 - Math.exp(-turnSmoothing * STEP);
  player.smoothedTurn += (turnTarget - player.smoothedTurn) * smooth;
  player.smoothedClimb += (climbTarget - player.smoothedClimb) * smooth;
  player.smoothedThrottle += (throttleTarget - player.smoothedThrottle) * smooth;

  if (world.tick <= 1) {
    player.speed = 0;
    player.vel.x = 0;
    player.vel.y = 0;
    player.vel.z = 0;
    player.pitch = 0;
  }

  if (player.perched) {
    const moving =
      Math.abs(player.smoothedThrottle) > 0.15 || Math.abs(player.smoothedClimb) > 0.15;
    if (input.perch || moving) {
      detach(world);
    } else {
      player.speed = 0;
      player.vel.x = 0;
      player.vel.y = 0;
      player.vel.z = 0;
      player.yaw -= player.smoothedTurn * p.yawRate * 0.55 * STEP;
      player.pitch *= 0.85;
      player.roll *= 0.88;
      if (player.bumpCooldown > 0) player.bumpCooldown--;
      if (player.invulnFrames > 0) player.invulnFrames--;
      if (player.cooldownFrames > 0) player.cooldownFrames--;
      trySting(world, input);
      return;
    }
  } else if (input.perch) {
    if (tryPerch(world)) {
      if (player.bumpCooldown > 0) player.bumpCooldown--;
      if (player.invulnFrames > 0) player.invulnFrames--;
      if (player.cooldownFrames > 0) player.cooldownFrames--;
      trySting(world, input);
      return;
    }
  }

  const maxSpeed = p.speed + p.boost;
  const speedFactor =
    0.55 + 0.45 * clamp(Math.abs(player.speed) / Math.max(1, maxSpeed), 0, 1);
  player.yaw -= player.smoothedTurn * p.yawRate * speedFactor * STEP;
  player.pitch = clamp(
    player.pitch + player.smoothedClimb * 1.6 * STEP,
    -p.pitchLimit,
    p.pitchLimit
  );

  const rollTarget =
    -player.smoothedTurn * rollLimit * (0.2 + 0.8 * clamp(Math.abs(player.speed) / p.speed, 0, 1));
  player.roll += (rollTarget - player.roll) * (1 - Math.exp(-8 * STEP));

  const targetSpeed =
    player.smoothedThrottle >= 0
      ? player.smoothedThrottle * (p.speed + (input.boost ? p.boost : 0))
      : player.smoothedThrottle * p.speed * 0.55;
  const response = Math.abs(targetSpeed) > Math.abs(player.speed) ? accel : drag;
  player.speed += (targetSpeed - player.speed) * (1 - Math.exp(-response * STEP));
  player.speed = clamp(player.speed, -p.speed * 0.55, p.speed + p.boost * 1.25);

  const dir = forward(player.yaw, player.pitch);
  const lift = player.smoothedClimb * liftSpeed;
  const velocityResponse = 1 - Math.exp(-9 * STEP);
  player.vel.x += (dir.x * player.speed - player.vel.x) * velocityResponse;
  player.vel.y += (dir.y * player.speed + lift - player.vel.y) * velocityResponse;
  player.vel.z += (dir.z * player.speed - player.vel.z) * velocityResponse;

  player.pos.x += player.vel.x * STEP;
  player.pos.y += player.vel.y * STEP;
  player.pos.z += player.vel.z * STEP;

  if (player.pos.y < tuning.minAltitude) {
    player.pos.y = tuning.minAltitude;
    player.vel.y = Math.max(0, player.vel.y);
  } else if (player.pos.y > tuning.maxAltitude) {
    player.pos.y = tuning.maxAltitude;
    player.vel.y = Math.min(0, player.vel.y);
  }

  const radius = Math.hypot(player.pos.x, player.pos.z);
  if (radius > tuning.arenaRadius) {
    const nx = player.pos.x / radius;
    const nz = player.pos.z / radius;
    player.pos.x = nx * tuning.arenaRadius;
    player.pos.z = nz * tuning.arenaRadius;
    const outward = player.vel.x * nx + player.vel.z * nz;
    if (outward > 0) {
      player.vel.x -= nx * outward;
      player.vel.z -= nz * outward;
      player.speed *= 0.9;
      if (player.bumpCooldown <= 0) {
        pushBump(world, player.pos.x, player.pos.y, player.pos.z, Math.min(8, outward));
        player.bumpCooldown = 12;
      }
    }
  }

  for (const solid of world.solids) {
    if (player.pos.y > solid.h + p.radius) continue;
    const hit = resolveCircleBox(player.pos.x, player.pos.z, p.radius, solid);
    if (!hit.hit) continue;
    player.pos.x = hit.x;
    player.pos.z = hit.z;
    const inward = player.vel.x * hit.nx + player.vel.z * hit.nz;
    if (inward < 0) {
      player.vel.x -= hit.nx * inward;
      player.vel.z -= hit.nz * inward;
      player.speed *= collisionLoss;
      if (player.bumpCooldown <= 0) {
        pushBump(world, hit.x, player.pos.y, hit.z, Math.min(10, -inward + 2));
        player.bumpCooldown = 12;
      }
    }
  }

  if (player.bumpCooldown > 0) player.bumpCooldown--;
  if (player.invulnFrames > 0) player.invulnFrames--;
  if (player.cooldownFrames > 0) player.cooldownFrames--;
  trySting(world, input);
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
    q(world.player.speed),
    q(world.player.roll),
    q(world.player.vel.x),
    q(world.player.vel.y),
    q(world.player.vel.z),
    q(world.player.smoothedThrottle),
    world.player.perched ? 1 : 0,
    q(world.player.perchY),
    world.player.invulnFrames,
    world.player.cooldownFrames,
    world.player.bumpCooldown,
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
