import { describe, expect, it } from 'vitest';
import { getChapter, type ChapterDef } from '../../src/content3';
import {
  advanceStory,
  collectedShardIds,
  consumeEvents,
  createStoryState,
  currentObjective,
  hashStory,
  stepStory,
  type StoryState
} from '../../src/sim3d/story';
import type { FlyInput } from '../../src/sim3d/flight';

const idle: FlyInput = { turn: 0, climb: 0, boost: false, sting: false };

function stub(overrides: Partial<ChapterDef> = {}): ChapterDef {
  return {
    id: 'test',
    order: 1,
    enabled: true,
    title: { en: 'Test', te: 'పరీక్ష' },
    subtitle: { en: 'Test', te: 'పరీక్ష' },
    location: 'lane',
    palette: {
      fog: '#000000',
      sky: '#000000',
      key: '#ffffff',
      fill: '#333333',
      accent: '#ffffff'
    },
    bounds: { radius: 50, minY: 1, maxY: 20 },
    spawn: { pos: { x: 0, y: 5, z: 0 }, yaw: 0 },
    layout: 'none',
    tuning: { speed: 0, boost: 0, arenaRadius: 50, minAltitude: 1, maxAltitude: 20, lives: 3 },
    objectives: [{ id: 'reach', kind: 'reach', label: { en: 'Reach', te: 'చేరుకో' }, target: { x: 0, y: 5, z: -4 }, radius: 2 }],
    waves: [],
    shards: [],
    hazards: [],
    cards: [],
    unlock: [],
    ...overrides
  };
}

function place(state: StoryState, x: number, y: number, z: number): void {
  state.world.player.pos.x = x;
  state.world.player.pos.y = y;
  state.world.player.pos.z = z;
}

function tick(state: StoryState, frames: number, input: FlyInput = idle): void {
  for (let i = 0; i < frames; i++) stepStory(state, input);
}

describe('story sim', () => {
  it('is deterministic for the same seed and input log', () => {
    const chapter = getChapter('ch1')!;
    const make = () => createStoryState(42, chapter);
    const inputs: FlyInput[] = Array.from({ length: 240 }, (_, i) => ({
      turn: i % 5 === 0 ? 1 : i % 7 === 0 ? -1 : 0,
      climb: i % 11 === 0 ? 1 : 0,
      boost: i % 13 === 0,
      sting: i % 3 === 0
    }));
    const a = make();
    const b = make();
    inputs.forEach((input) => {
      stepStory(a, input);
      stepStory(b, input);
    });
    expect(hashStory(a)).toBe(hashStory(b));
  });

  it('opens with the intro card', () => {
    const state = createStoryState(1, getChapter('ch1')!);
    const events = consumeEvents(state);
    expect(events).toContainEqual({ type: 'card', id: 'ch1-intro' });
  });

  it('completes a reach objective and advances', () => {
    const state = createStoryState(2, stub());
    place(state, 0, 5, -4);
    stepStory(state, idle);
    expect(state.objectiveIndex).toBe(1);
    expect(state.phase).toBe('complete');
  });

  it('cascades collect after reach when the shards are already found', () => {
    const chapter = getChapter('ch1')!;
    const state = createStoryState(3, chapter);
    place(state, 0, 7, -22);
    stepStory(state, idle);
    for (const shard of chapter.shards!) {
      place(state, shard.pos.x, shard.pos.y, shard.pos.z);
      stepStory(state, idle);
    }
    place(state, 0, 7, -22);
    stepStory(state, idle);
    expect(state.objectiveIndex).toBe(2);
    expect(collectedShardIds(state)).toHaveLength(4);
    expect(currentObjective(state)?.kind).toBe('survive');
  });

  it('completes a survive objective on the clock', () => {
    const state = createStoryState(
      4,
      stub({
        objectives: [
          { id: 'wait', kind: 'survive', label: { en: 'Wait', te: 'వేచి ఉండు' }, seconds: 1 }
        ]
      })
    );
    tick(state, 61);
    expect(state.phase).toBe('complete');
  });

  it('completes a write objective in mark order', () => {
    const marks = [
      { x: 0, y: 5, z: -2 },
      { x: 2, y: 5, z: -2 },
      { x: 4, y: 5, z: -2 }
    ];
    const state = createStoryState(
      5,
      stub({
        objectives: [
          {
            id: 'write',
            kind: 'write',
            label: { en: 'Write', te: 'రాయి' },
            marks,
            radius: 1
          }
        ]
      })
    );
    for (const mark of marks) {
      place(state, mark.x, mark.y, mark.z);
      stepStory(state, idle);
    }
    expect(state.writeIndex).toBe(3);
    expect(state.phase).toBe('complete');
  });

  it('counts a kill toward a destroy objective', () => {
    const state = createStoryState(
      6,
      stub({
        tuning: { speed: 0, boost: 0, arenaRadius: 50, minAltitude: 1, maxAltitude: 20, lives: 3 },
        objectives: [
          { id: 'kill', kind: 'destroy', label: { en: 'Kill', te: 'చంపు' }, count: 1 }
        ],
        waves: [{ atSeconds: 0, count: 1, pos: { x: 0, y: 5, z: -3 } }]
      })
    );
    state.world.foes[0].hp = 1;
    place(state, 0, 5, 0);
    stepStory(state, { ...idle, sting: true });
    expect(state.phase).toBe('complete');
  });

  it('respawns at the checkpoint after losing every life', () => {
    const state = createStoryState(
      7,
      stub({
        waves: [{ atSeconds: 0, count: 1, pos: { x: 0, y: 5, z: 0 } }]
      })
    );
    state.world.lives = 1;
    state.checkpoint = { x: 7, y: 6, z: 8 };
    stepStory(state, idle);
    expect(state.deaths).toBe(1);
    expect(state.lives).toBe(3);
    expect(state.world.player.pos).toEqual({ x: 7, y: 6, z: 8 });
  });

  it('advances with a fixed step and stops when complete', () => {
    const state = createStoryState(8, stub());
    const result = advanceStory(state, idle, 0.05, 0);
    expect(result.steps).toBeGreaterThan(0);
    expect(state.elapsed).toBeGreaterThan(0);
  });
});
