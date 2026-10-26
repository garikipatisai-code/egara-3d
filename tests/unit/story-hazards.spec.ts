import { describe, expect, it } from 'vitest';
import { consumeEvents, createStoryState, stepStory } from '../../src/sim3d/story';
import { idle, place, stubChapter, tick } from './story-fixtures';

describe('shards and checkpoints', () => {
  it('collects a shard once, sets the checkpoint, and emits an event', () => {
    const state = createStoryState(
      1,
      stubChapter({
        shards: [
          {
            id: 's1',
            pos: { x: 0, y: 5, z: -2 },
            motif: 'locket',
            caption: { en: 'A locket.', te: 'ఒక లాకెట్.' }
          }
        ]
      })
    );
    place(state, 0, 5, -2);
    stepStory(state, idle);
    const events = consumeEvents(state);
    expect(state.shards.s1).toBe(true);
    expect(state.checkpoint).toEqual({ x: 0, y: 5, z: -2 });
    expect(events.filter((event) => event.type === 'shard')).toHaveLength(1);

    stepStory(state, idle);
    expect(consumeEvents(state).filter((event) => event.type === 'shard')).toHaveLength(0);
  });

  it('respawns at the last shard, not the chapter start', () => {
    const state = createStoryState(
      2,
      stubChapter({
        objectives: [
          {
            id: 'wait',
            kind: 'survive',
            label: { en: 'Wait', te: 'వేచి ఉండు' },
            seconds: 100
          }
        ],
        shards: [
          {
            id: 's1',
            pos: { x: 0, y: 5, z: -2 },
            motif: 'locket',
            caption: { en: 'A locket.', te: 'ఒక లాకెట్.' }
          }
        ],
        waves: [{ atSeconds: 0, count: 1, pos: { x: 10, y: 5, z: 0 } }]
      })
    );
    place(state, 0, 5, -2);
    stepStory(state, idle);
    expect(state.checkpoint).toEqual({ x: 0, y: 5, z: -2 });

    place(state, 10, 5, 0);
    state.world.lives = 1;
    stepStory(state, idle);
    expect(state.deaths).toBe(1);
    expect(state.world.player.pos).toEqual({ x: 0, y: 5, z: -2 });
  });
});

describe('hazards', () => {
  it('pushes the player through a wind column along its direction', () => {
    const state = createStoryState(
      3,
      stubChapter({
        hazards: [
          {
            id: 'wind',
            kind: 'wind',
            pos: { x: 0, y: 5, z: 0 },
            radius: 4,
            height: 6,
            strength: 12,
            dir: { x: 1, y: 0, z: 0 }
          }
        ]
      })
    );
    const x0 = state.world.player.pos.x;
    stepStory(state, idle);
    expect(state.world.player.pos.x).toBeGreaterThan(x0);
  });

  it('hurts only while the swatter is active', () => {
    const state = createStoryState(
      4,
      stubChapter({
        hazards: [
          {
            id: 'swatter',
            kind: 'swatter',
            pos: { x: 0, y: 5, z: 0 },
            radius: 2,
            periodSeconds: 4,
            activeSeconds: 1,
            path: [
              { x: -6, y: 5, z: 0 },
              { x: 6, y: 5, z: 0 }
            ]
          }
        ]
      })
    );
    place(state, 5.9, 5, 0);
    state.elapsed = 0.2;
    stepStory(state, idle);
    expect(state.world.lives).toBe(3);

    state.elapsed = 3.8;
    stepStory(state, idle);
    expect(state.world.lives).toBe(2);
  });

  it('hurts inside the lamp heat radius', () => {
    const state = createStoryState(
      5,
      stubChapter({
        hazards: [
          {
            id: 'lamp',
            kind: 'lamp',
            pos: { x: 0, y: 5, z: 0 },
            radius: 3,
            height: 4
          }
        ]
      })
    );
    stepStory(state, idle);
    expect(state.world.lives).toBe(2);
  });

  it('moves a tweezer along its path and reports the runtime position', () => {
    const state = createStoryState(
      6,
      stubChapter({
        hazards: [
          {
            id: 'tweezer',
            kind: 'tweezer',
            pos: { x: -8, y: 5, z: 0 },
            radius: 1,
            periodSeconds: 4,
            activeSeconds: 1,
            path: [
              { x: -8, y: 5, z: 0 },
              { x: 8, y: 5, z: 0 }
            ]
          }
        ]
      })
    );
    tick(state, 60);
    const runtime = state.hazards[0];
    expect(runtime.x).toBeGreaterThan(-8);
    expect(runtime.x).toBeLessThan(8);
  });

  it('raises paranoia over time and clamps it', () => {
    const state = createStoryState(7, stubChapter());
    tick(state, 60);
    expect(state.paranoia).toBeGreaterThan(0.1);
    expect(state.paranoia).toBeLessThan(1);
    state.paranoia = 99.99;
    tick(state, 10);
    expect(state.paranoia).toBe(100);
  });
});
