import { describe, expect, it } from 'vitest';
import {
  consumeBumps,
  createWorld,
  hashWorld,
  stepWorld,
  type FlyInput,
  type Tuning,
  type World
} from '../../src/sim3d/flight';
import { clearCameraTarget, resolveCircleBox, segmentBoxHit } from '../../src/sim3d/collision';

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

describe('inertial flight', () => {
  it('accelerates toward boost speed and drags back to cruise', () => {
    const world = createWorld(1, tuning);
    expect(world.player.speed).toBe(0);
    run(world, 90, { ...idle, throttle: 1, boost: true });
    expect(world.player.speed).toBeGreaterThan(21);
    run(world, 150, idle);
    expect(world.player.speed).toBeLessThan(15.5);
  });

  it('banks into a turn and levels out', () => {
    const world = createWorld(2, tuning);
    run(world, 40, { ...idle, turn: 1, throttle: 1 });
    expect(world.player.roll).toBeLessThan(-0.2);
    run(world, 90, idle);
    expect(Math.abs(world.player.roll)).toBeLessThan(0.08);
  });

  it('smooths input instead of snapping the yaw', () => {
    const a = createWorld(3, tuning);
    const b = createWorld(3, tuning);
    stepWorld(a, { ...idle, turn: 1 });
    const oneFrame = Math.abs(a.player.yaw);
    run(b, 20, { ...idle, turn: 1 });
    const manyFrames = Math.abs(b.player.yaw);
    expect(manyFrames).toBeGreaterThan(oneFrame * 4);
  });

  it('keeps determinism with velocity and banking', () => {
    const inputs: FlyInput[] = Array.from({ length: 240 }, (_, i) => ({
      turn: i % 5 === 0 ? 1 : i % 7 === 0 ? -1 : 0,
      climb: i % 11 === 0 ? 1 : 0,
      boost: i % 13 === 0,
      sting: i % 3 === 0
    }));
    const a = createWorld(4, tuning);
    const b = createWorld(4, tuning);
    inputs.forEach((input) => {
      stepWorld(a, input);
      stepWorld(b, input);
    });
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});

describe('rotated-box collision', () => {
  const box = { x: 0, z: -10, w: 10, d: 10, rot: 0, h: 20, r: 6, colorIdx: 0 };

  it('stops a head-on flight outside the face without teleporting', () => {
    const world = createWorld(5, tuning, [box]);
    world.player.pos = { x: 0, y: 8, z: 0 };
    world.player.yaw = Math.PI;
    run(world, 120, { ...idle, throttle: 1 });
    expect(world.player.pos.z).toBeGreaterThanOrEqual(-5 - tuning.player.radius - 1e-6);
    expect(world.player.pos.z).toBeLessThan(0);
  });

  it('emits one bump per contact window and consumes it', () => {
    const world = createWorld(6, tuning, [box]);
    world.player.pos = { x: 0, y: 8, z: 0 };
    world.player.yaw = Math.PI;
    run(world, 120, { ...idle, throttle: 1 });
    const bumps = consumeBumps(world);
    expect(bumps.length).toBeGreaterThan(0);
    expect(consumeBumps(world)).toEqual([]);
  });

  it('resolves a rotated box', () => {
    const rotated = { ...box, rot: Math.PI / 4 };
    const hit = resolveCircleBox(0, -10, 1, rotated);
    expect(hit.hit).toBe(true);
    const again = resolveCircleBox(hit.x, hit.z, 1, rotated);
    expect(again.hit).toBe(false);
  });

  it('clamps to the arena with a bump', () => {
    const world = createWorld(7, { ...tuning, arenaRadius: 12 });
    run(world, 400, { ...idle, throttle: 1, boost: true });
    expect(Math.hypot(world.player.pos.x, world.player.pos.z)).toBeLessThanOrEqual(12 + 1e-6);
    expect(consumeBumps(world).length).toBeGreaterThan(0);
  });
});

describe('collision + camera helpers', () => {
  it('returns the corrected position and outward normal', () => {
    const box = { x: 0, z: 0, w: 10, d: 10, rot: 0 };
    const hit = resolveCircleBox(0, 5.5, 1, box);
    expect(hit.hit).toBe(true);
    expect(hit.nz).toBeGreaterThan(0.9);
    expect(hit.z).toBeGreaterThanOrEqual(6 - 1e-6);
  });

  it('ignores a circle that is clear of the box', () => {
    const box = { x: 0, z: 0, w: 10, d: 10, rot: 0 };
    expect(resolveCircleBox(20, 20, 1, box).hit).toBe(false);
  });

  it('finds the first camera obstruction on the segment', () => {
    const box = { x: 0, z: -10, w: 10, d: 4, rot: 0, h: 20 };
    const t = segmentBoxHit(0, 0, 0, -20, box, 0.8, 5, 5);
    expect(t).not.toBeNull();
    expect(t!).toBeGreaterThan(0.3);
    expect(t!).toBeLessThan(0.45);
  });

  it('pulls the camera in front of the obstruction', () => {
    const box = { x: 0, z: -10, w: 10, d: 4, rot: 0, h: 20 };
    const cleared = clearCameraTarget({ x: 0, y: 5, z: 0 }, { x: 0, y: 5, z: -20 }, [box]);
    expect(cleared.z).toBeGreaterThan(-8);
    expect(cleared.z).toBeLessThan(0);
  });

  it('leaves a clear camera path alone', () => {
    const to = { x: 4, y: 5, z: -20 };
    const cleared = clearCameraTarget({ x: 0, y: 5, z: 0 }, to, []);
    expect(cleared).toEqual(to);
  });
});
