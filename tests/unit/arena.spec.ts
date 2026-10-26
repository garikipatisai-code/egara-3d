import { describe, expect, it } from 'vitest';
import { buildArenaLayout } from '../../src/sim3d/arena';
import { createWorld, hashWorld, stepWorld, type Tuning } from '../../src/sim3d/flight';

const tuning: Tuning = {
  arenaRadius: 120,
  minAltitude: 1,
  maxAltitude: 40,
  runSeconds: 90,
  player: { speed: 14, boost: 10, yawRate: 2.2, pitchLimit: 0.6, radius: 1, lives: 3, invulnFrames: 60 },
  sting: { range: 14, cooldownFrames: 8, damage: 1 },
  foe: { hp: 2, radius: 1.6, speed: 6, score: 100 },
  pools: { foes: 12 },
  waves: { intervalSeconds: 600, count: 0 }
};

describe('arena collision', () => {
  it('builds the same city for the same seed', () => {
    const a = buildArenaLayout(7);
    const b = buildArenaLayout(7);
    expect(a).toEqual(b);
    expect(a).toHaveLength(26);
    const c = buildArenaLayout(8);
    expect(c[0]).not.toEqual(a[0]);
  });

  it('pushes the player out of buildings below roof height', () => {
    const solids = [{ x: 20, z: 0, r: 6, h: 30, w: 10, d: 10, rot: 0, colorIdx: 0 }];
    const world = createWorld(1, tuning, solids);
    world.player.pos.x = 20;
    world.player.pos.y = 5;
    world.player.pos.z = 0;
    stepWorld(world, { turn: 0, climb: 0, boost: false, sting: false });
    const dist = Math.hypot(world.player.pos.x - 20, world.player.pos.z);
    expect(dist).toBeGreaterThanOrEqual(solids[0].w / 2 + tuning.player.radius - 1e-9);
  });

  it('lets flight above the roof pass over', () => {
    const solids = [{ x: 20, z: 0, r: 6, h: 10, w: 10, d: 10, rot: 0, colorIdx: 0 }];
    const world = createWorld(2, tuning, solids);
    world.player.pos.x = 14;
    world.player.pos.y = 20;
    world.player.pos.z = 0;
    world.player.yaw = Math.PI / 2;
    stepWorld(world, { turn: 0, climb: 0, boost: false, sting: false });
    expect(world.player.pos.x).toBeGreaterThan(14);
  });

  it('stays deterministic with solids', () => {
    const solids = buildArenaLayout(7);
    const make = () => createWorld(3, tuning, solids);
    const a = make();
    const b = make();
    for (let i = 0; i < 200; i++) {
      stepWorld(a, { turn: 1, climb: 0, boost: true, sting: false });
      stepWorld(b, { turn: 1, climb: 0, boost: true, sting: false });
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
