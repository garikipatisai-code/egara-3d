import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/content3';
import { StoryRuntime } from '../../src/story/runtime';
import { defaultSave } from '../../src/core/save';
import {
  consumeEvents,
  createStoryState,
  hashStory,
  stepStory,
  type StoryState
} from '../../src/sim3d/story';
import { idle, place, tick } from './story-fixtures';

function breakBoss(state: StoryState): void {
  const boss = state.chapter.objectives[0];
  for (const target of boss.targets ?? []) {
    place(state, target.x, target.y, target.z);
    stepStory(state, { ...idle, sting: true });
    tick(state, 31);
  }
}

describe('finale: wing clip and cannon', () => {
  it('breaks four pillars, clips a wing once, and reduces flight', () => {
    const state = createStoryState(1, getChapter('ch8')!);
    breakBoss(state);

    expect(state.objectiveIndex).toBe(1);
    expect(state.wingClipped).toBe(true);
    expect(state.events.some((event) => event.type === 'wingClip')).toBe(true);
    expect(state.world.tuning.player.speed).toBeCloseTo(16 * 0.65, 5);
    expect(state.world.tuning.player.boost).toBe(0);

    const before = state.events.length;
    stepStory(state, idle);
    expect(state.events.slice(before).some((event) => event.type === 'wingClip')).toBe(false);
  });

  it('survives the needle and fires the cannon after the clip', () => {
    const state = createStoryState(2, getChapter('ch8')!);
    breakBoss(state);
    tick(state, 15 * 60 + 5);
    expect(state.objectiveIndex).toBe(2);

    place(state, 0, 8, -10);
    stepStory(state, { ...idle, sting: true });
    expect(state.phase).toBe('complete');
    expect(state.events.some((event) => event.type === 'complete')).toBe(true);
  });

  it('gives the amulet an extra life', () => {
    const state = createStoryState(3, getChapter('ch1')!, 1);
    expect(state.lives).toBe(4);
    expect(state.world.lives).toBe(4);
  });

  it('passes the amulet bonus through the story runtime', () => {
    const save = { ...defaultSave(), amulet: true };
    const runtime = new StoryRuntime(save, () => 4);
    runtime.openBriefing('ch1');
    expect(runtime.story?.lives).toBe(4);
  });

  it('hashes the clipped state deterministically', () => {
    const a = createStoryState(5, getChapter('ch8')!);
    const b = createStoryState(5, getChapter('ch8')!);
    breakBoss(a);
    breakBoss(b);
    expect(hashStory(a)).toBe(hashStory(b));
    expect(hashStory(a)).not.toBe(hashStory(createStoryState(5, getChapter('ch8')!)));
  });

  it('finalises chapter eight with no next chapter and keeps the amulet', () => {
    const shards = Array.from({ length: 12 }, (_, index) => `s-${index}`);
    const save = defaultSave();
    save.shards = shards;
    save.amulet = true;
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7']) {
      save.chapters[id] = { done: true, bestTime: 90, shards: [], deaths: 0 };
    }
    const runtime = new StoryRuntime(save, () => 9);
    expect(runtime.openBriefing('ch8')).toBe(true);
    runtime.begin();
    expect(runtime.story?.lives).toBe(4);
    runtime.story!.phase = 'complete';
    runtime.story!.elapsed = 60;
    runtime.step(idle, 1 / 60);
    expect(runtime.result?.chapterId).toBe('ch8');
    expect(runtime.save.chapters.ch8.done).toBe(true);
    expect(runtime.save.amulet).toBe(true);
    expect(runtime.nextChapter()).toBeNull();
  });

  it('clears the wingClip event after consumption', () => {
    const state = createStoryState(6, getChapter('ch8')!);
    breakBoss(state);
    const events = consumeEvents(state);
    expect(events.some((event) => event.type === 'wingClip')).toBe(true);
    expect(consumeEvents(state)).toEqual([]);
  });
});
