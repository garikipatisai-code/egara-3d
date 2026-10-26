import type { ChapterDef } from '../../src/content3';
import type { FlyInput } from '../../src/sim3d/flight';
import type { StoryState } from '../../src/sim3d/story';
import { stepStory } from '../../src/sim3d/story';

export const idle: FlyInput = { turn: 0, climb: 0, boost: false, sting: false };

export function stubChapter(overrides: Partial<ChapterDef> = {}): ChapterDef {
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
    objectives: [
      {
        id: 'reach',
        kind: 'reach',
        label: { en: 'Reach', te: 'చేరుకో' },
        target: { x: 0, y: 5, z: -4 },
        radius: 2
      }
    ],
    waves: [],
    shards: [],
    hazards: [],
    cards: [],
    unlock: [],
    ...overrides
  };
}

export function place(state: StoryState, x: number, y: number, z: number): void {
  state.world.player.pos.x = x;
  state.world.player.pos.y = y;
  state.world.player.pos.z = z;
}

export function tick(state: StoryState, frames: number, input: FlyInput = idle): void {
  for (let i = 0; i < frames; i++) stepStory(state, input);
}
