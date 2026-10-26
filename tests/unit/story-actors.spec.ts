import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/content3';
import {
  createStoryState,
  hashStory,
  stepStory,
  type StoryState
} from '../../src/sim3d/story';
import { idle, place, stubChapter, tick } from './story-fixtures';

function actorChapter(overrides: Parameters<typeof stubChapter>[0] = {}) {
  return stubChapter({
    objectives: [
      { id: 'wait', kind: 'survive', label: { en: 'Wait', te: 'వేచి ఉండు' }, seconds: 100 }
    ],
    actors: [
      {
        id: 'car',
        kind: 'car',
        path: [
          { x: 0, y: 5, z: 0 },
          { x: 0, y: 5, z: -10 }
        ],
        speed: 6
      }
    ],
    ...overrides
  });
}

describe('kinematic actors', () => {
  it('moves an actor along its path and stops at the end', () => {
    const state = createStoryState(1, actorChapter());
    tick(state, 30);
    expect(state.actors[0].z).toBeLessThan(0);
    expect(state.actors[0].done).toBe(false);
    tick(state, 150);
    expect(state.actors[0].z).toBe(-10);
    expect(state.actors[0].done).toBe(true);
  });

  it('is deterministic with an actor', () => {
    const make = () => createStoryState(42, getChapter('ch4')!);
    const a = make();
    const b = make();
    for (let i = 0; i < 180; i++) {
      const input = { turn: i % 4 === 0 ? 1 : 0, climb: 0, boost: i % 3 === 0, sting: false };
      stepStory(a, input);
      stepStory(b, input);
    }
    expect(hashStory(a)).toBe(hashStory(b));
  });
});

describe('escort and actor-relative writing', () => {
  it('completes an escort while the player stays close', () => {
    const state = createStoryState(
      3,
      stubChapter({
        objectives: [
          {
            id: 'escort',
            kind: 'escort',
            actorId: 'car',
            seconds: 1,
            radius: 6,
            label: { en: 'Escort', te: 'కాపాడు' }
          }
        ],
        actors: [
          {
            id: 'car',
            kind: 'car',
            path: [
              { x: 0, y: 5, z: 0 },
              { x: 0, y: 5, z: -1 }
            ],
            speed: 0.01
          }
        ]
      })
    );
    tick(state, 61);
    expect(state.phase).toBe('complete');
  });

  it('writes marks relative to the car, not the world origin', () => {
    const state = createStoryState(
      4,
      stubChapter({
        objectives: [
          {
            id: 'write',
            kind: 'write',
            actorId: 'car',
            radius: 1,
            marks: [{ x: 0, y: 5, z: 0 }],
            label: { en: 'Write', te: 'రాయి' }
          }
        ],
        actors: [
          {
            id: 'car',
            kind: 'car',
            path: [
              { x: 0, y: 5, z: 0 },
              { x: 0, y: 5, z: 0 }
            ],
            speed: 0.01
          }
        ]
      })
    );
    place(state, 0, 10, 0);
    stepStory(state, idle);
    expect(state.phase).toBe('complete');
  });
});

describe('sabotage and boss nodes', () => {
  it('breaks three sabotage nodes with sting presses and raises paranoia', () => {
    const state = createStoryState(
      5,
      stubChapter({
        objectives: [
          {
            id: 'pillars',
            kind: 'sabotage',
            count: 3,
            radius: 2,
            targets: [
              { x: 0, y: 5, z: -3 },
              { x: 5, y: 5, z: 0 },
              { x: 0, y: 5, z: 3 }
            ],
            label: { en: 'Pillars', te: 'స్తంభాలు' }
          }
        ]
      })
    );
    for (const target of [
      { x: 0, y: 5, z: -3 },
      { x: 5, y: 5, z: 0 },
      { x: 0, y: 5, z: 3 }
    ]) {
      place(state, target.x, target.y, target.z);
      stepStory(state, { ...idle, sting: true });
      tick(state, 31);
    }
    expect(state.phase).toBe('complete');
    expect(state.paranoia).toBeGreaterThanOrEqual(75);
  });

  it('completes a boss objective and emits node events', () => {
    const state = createStoryState(
      6,
      stubChapter({
        boss: { id: 'diviner', name: { en: 'The Diviner', te: 'భవిష్యవక్త' }, nodes: 2 },
        objectives: [
          {
            id: 'boss',
            kind: 'boss',
            bossId: 'diviner',
            count: 2,
            radius: 2,
            targets: [
              { x: 0, y: 5, z: -3 },
              { x: 0, y: 5, z: 3 }
            ],
            label: { en: 'Break', te: 'విచ్ఛిన్నం' }
          }
        ]
      })
    );
    place(state, 0, 5, -3);
    stepStory(state, { ...idle, sting: true });
    expect(state.events.some((event) => event.type === 'node' && event.kind === 'boss')).toBe(true);
    tick(state, 31);
    place(state, 0, 5, 3);
    stepStory(state, { ...idle, sting: true });
    expect(state.phase).toBe('complete');
  });
});

describe('fire and paranoia waves', () => {
  it('keeps fire inactive until its objective and then damages', () => {
    const state = createStoryState(
      7,
      stubChapter({
        objectives: [
          { id: 'first', kind: 'survive', label: { en: 'First', te: 'మొదటి' }, seconds: 0.05 },
          { id: 'second', kind: 'survive', label: { en: 'Second', te: 'రెండో' }, seconds: 100 }
        ],
        hazards: [
          {
            id: 'fire',
            kind: 'fire',
            pos: { x: 0, y: 5, z: 0 },
            radius: 3,
            height: 5,
            activeAfterObjective: 1
          }
        ]
      })
    );
    tick(state, 3);
    expect(state.world.lives).toBe(3);
    tick(state, 6);
    expect(state.objectiveIndex).toBe(1);
    stepStory(state, idle);
    expect(state.world.lives).toBe(2);
  });

  it('fires a paranoia wave exactly once', () => {
    const state = createStoryState(
      8,
      stubChapter({
        waves: [
          {
            atSeconds: 0,
            atParanoia: 10,
            count: 1,
            pos: { x: 8, y: 5, z: 0 }
          }
        ]
      })
    );
    expect(state.world.foes.filter((foe) => foe.alive)).toHaveLength(0);
    state.paranoia = 9;
    stepStory(state, idle);
    expect(state.world.foes.filter((foe) => foe.alive)).toHaveLength(0);
    state.paranoia = 10;
    stepStory(state, idle);
    expect(state.world.foes.filter((foe) => foe.alive)).toHaveLength(1);
    tick(state, 5);
    expect(state.world.foes.filter((foe) => foe.alive)).toHaveLength(1);
  });
});
