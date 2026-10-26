import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  spawnFoe,
  stepWorld,
  type FlyInput,
  type Tuning
} from '../../src/sim3d/flight';

const tuning: Tuning = {
  arenaRadius: 120,
  minAltitude: 1,
  maxAltitude: 40,
  runSeconds: 90,
  player: { speed: 14, boost: 10, yawRate: 2.2, pitchLimit: 0.6, radius: 1, lives: 3, invulnFrames: 60 },
  sting: { range: 14, cooldownFrames: 8, damage: 1 },
  foe: { hp: 2, radius: 1.6, speed: 6, score: 100 },
  pools: { foes: 12 },
  waves: { intervalSeconds: 6, count: 2 }
};

const idle: FlyInput = { turn: 0, climb: 0, boost: false, sting: false };

function runFrames(world: ReturnType<typeof createWorld>, n: number, input: FlyInput = idle): void {
  for (let i = 0; i < n; i++) stepWorld(world, input);
}

describe('3d flight sim', () => {
  it('is deterministic for the same seed and input log', () => {
    const inputs: FlyInput[] = Array.from({ length: 300 }, (_, i) => ({
      turn: i % 5 === 0 ? 1 : i % 7 === 0 ? -1 : 0,
      climb: i % 11 === 0 ? 1 : 0,
      boost: i % 13 === 0,
      sting: i % 3 === 0
    }));
    const a = createWorld(42, tuning);
    const b = createWorld(42, tuning);
    inputs.forEach((input) => {
      stepWorld(a, input);
      stepWorld(b, input);
    });
    expect(hashWorld(a)).toBe(hashWorld(b));
  });

  it('turns right toward screen-right and climbs within limits', () => {
    const world = createWorld(1, tuning);
    const yaw0 = world.player.yaw;
    runFrames(world, 60, { turn: 1, climb: 0, boost: false, sting: false });
    expect(world.player.yaw).toBeLessThan(yaw0);

    const up = createWorld(2, tuning);
    runFrames(up, 600, { turn: 0, climb: 1, boost: false, sting: false });
    expect(up.player.pos.y).toBeLessThanOrEqual(tuning.maxAltitude);
    expect(up.player.pitch).toBeLessThanOrEqual(tuning.player.pitchLimit + 1e-9);
  });

  it('clamps to the arena', () => {
    const world = createWorld(3, tuning);
    runFrames(world, 3000, { turn: 0, climb: 0, boost: true, sting: false });
    const r = Math.hypot(world.player.pos.x, world.player.pos.z);
    expect(r).toBeLessThanOrEqual(tuning.arenaRadius + 1e-6);
  });

  it('stings the nearest foe in range for score', () => {
    const world = createWorld(4, tuning);
    spawnFoe(world, world.player.pos.x + 5, world.player.pos.y, world.player.pos.z);
    spawnFoe(world, world.player.pos.x - 5, world.player.pos.y, world.player.pos.z);
    runFrames(world, 40, { turn: 0, climb: 0, boost: false, sting: true });
    expect(world.score).toBeGreaterThan(0);
    expect(world.foes.filter((f) => f.alive).length).toBeLessThan(2);
  });

  it('loses a life on contact, then goes invulnerable', () => {
    const world = createWorld(5, tuning);
    spawnFoe(world, world.player.pos.x, world.player.pos.y, world.player.pos.z);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
  });

  it('spawns waves over time', () => {
    const world = createWorld(6, tuning);
    runFrames(world, 60 * 7);
    expect(world.foes.filter((f) => f.alive).length).toBeGreaterThan(0);
  });

  it('keeps pools fixed', () => {
    const world = createWorld(7, tuning);
    runFrames(world, 1200, { turn: 0, climb: 0, boost: false, sting: true });
    expect(world.foes).toHaveLength(tuning.pools.foes);
  });
});
