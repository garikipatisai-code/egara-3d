import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  stepWorld,
  type FlyInput,
  type Tuning,
  type World
} from '../../src/sim3d/flight';

const tuning: Tuning = {
  arenaRadius: 120,
  minAltitude: 1,
  maxAltitude: 40,
  runSeconds: 90,
  player: {
    speed: 14,
    boost: 10,
    yawRate: 2.2,
    pitchLimit: 0.6,
    radius: 1,
    lives: 3,
    invulnFrames: 60
  },
  sting: { range: 14, cooldownFrames: 8, damage: 1 },
  foe: { hp: 2, radius: 1.6, speed: 6, score: 100 },
  pools: { foes: 12 },
  waves: { intervalSeconds: 600, count: 0 }
};

const idle: FlyInput = { turn: 0, climb: 0, boost: false, sting: false };

function run(world: World, frames: number, input: FlyInput = idle): void {
  for (let i = 0; i < frames; i++) stepWorld(world, input);
}

describe('hover-first flight', () => {
  it('stays put with no throttle', () => {
    const world = createWorld(1, tuning);
    run(world, 120);
    expect(world.player.speed).toBeCloseTo(0, 5);
    expect(world.player.pos.x).toBeCloseTo(0, 5);
    expect(world.player.pos.y).toBeCloseTo(8, 5);
    expect(world.player.pos.z).toBeCloseTo(0, 5);
  });

  it('moves forward and reverse on throttle', () => {
    const world = createWorld(2, tuning);
    run(world, 60, { ...idle, throttle: 1 });
    expect(world.player.speed).toBeGreaterThan(10);
    expect(world.player.pos.z).toBeGreaterThan(4);

    run(world, 120, { ...idle, throttle: -1 });
    expect(world.player.speed).toBeLessThan(0);
    expect(world.player.pos.z).toBeLessThan(10);
  });

  it('ascends and descends without forward motion', () => {
    const world = createWorld(3, tuning);
    run(world, 60, { ...idle, climb: 1 });
    expect(world.player.pos.y).toBeGreaterThan(9);
    expect(Math.abs(world.player.pos.z)).toBeLessThan(0.2);

    const y = world.player.pos.y;
    run(world, 60, { ...idle, climb: -1 });
    expect(world.player.pos.y).toBeLessThan(y);
  });

  it('perches on the ground and takes off again', () => {
    const world = createWorld(4, tuning);
    world.player.pos = { x: 0, y: 2.2, z: 0 };
    stepWorld(world, { ...idle, perch: true });
    expect(world.player.perched).toBe(true);
    expect(world.player.speed).toBe(0);
    expect(world.player.pos.y).toBeCloseTo(1.35, 5);

    run(world, 30);
    expect(world.player.perched).toBe(true);
    expect(world.player.pos.y).toBeCloseTo(1.35, 5);

    stepWorld(world, { ...idle, perch: true });
    expect(world.player.perched).toBe(false);
    expect(world.player.pos.y).toBeGreaterThan(2);
  });

  it('perches on a rooftop and leaves with throttle', () => {
    const solid = { x: 0, z: -5, w: 10, d: 10, rot: 0, h: 10, r: 6, colorIdx: 0 };
    const world = createWorld(5, tuning, [solid]);
    world.player.pos = { x: 0, y: 10.5, z: -5 };
    stepWorld(world, { ...idle, perch: true });
    expect(world.player.perched).toBe(true);
    expect(world.player.pos.y).toBeCloseTo(10.35, 5);

    stepWorld(world, { ...idle, throttle: 1 });
    expect(world.player.perched).toBe(false);
    expect(world.player.pos.y).toBeGreaterThan(11);
  });

  it('does not perch in open air', () => {
    const world = createWorld(6, tuning);
    world.player.pos = { x: 0, y: 20, z: 0 };
    stepWorld(world, { ...idle, perch: true });
    expect(world.player.perched).toBe(false);
  });

  it('hashes throttle and perch deterministically', () => {
    const inputs: FlyInput[] = Array.from({ length: 240 }, (_, i) => ({
      turn: i % 5 === 0 ? 1 : i % 7 === 0 ? -1 : 0,
      climb: i % 11 === 0 ? 1 : 0,
      throttle: i % 13 === 0 ? 1 : i % 17 === 0 ? -1 : 0,
      perch: i === 60 || i === 120,
      boost: i % 19 === 0,
      sting: i % 3 === 0
    }));
    const a = createWorld(7, tuning);
    const b = createWorld(7, tuning);
    inputs.forEach((input) => {
      stepWorld(a, input);
      stepWorld(b, input);
    });
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
