import { describe, expect, it } from 'vitest';
import { StoryRuntime } from '../../src/story/runtime';
import { defaultSave, type SaveData } from '../../src/core/save';
import { idle } from './story-fixtures';

function makeRuntime(save: SaveData = defaultSave()): { runtime: StoryRuntime; saves: SaveData[] } {
  const saves: SaveData[] = [];
  const runtime = new StoryRuntime(save, () => 7, (next) => saves.push(next));
  return { runtime, saves };
}

describe('story runtime', () => {
  it('starts with only chapter one unlocked and playable', () => {
    const { runtime } = makeRuntime();
    expect(runtime.canStart('ch1')).toBe(true);
    expect(runtime.canStart('ch2')).toBe(false);
    expect(runtime.canStart('ch3')).toBe(false);
    expect(runtime.canStart('ch4')).toBe(false);
    expect(runtime.continueChapter()?.id).toBe('ch1');
    expect(runtime.selectCards().filter((card) => !card.locked)).toHaveLength(1);
  });

  it('opens a briefing without starting the sim', () => {
    const { runtime } = makeRuntime();
    expect(runtime.openBriefing('ch1')).toBe(true);
    expect(runtime.screen).toBe('briefing');
    expect(runtime.story?.chapter.id).toBe('ch1');
    runtime.begin();
    expect(runtime.screen).toBe('playing');
  });

  it('completes a chapter, saves shards, and unlocks the next', () => {
    const { runtime, saves } = makeRuntime();
    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.story!.elapsed = 42.5;
    runtime.story!.deaths = 2;
    runtime.story!.shards['s1-1'] = true;
    runtime.story!.shards['s1-2'] = true;

    runtime.step(idle, 1 / 60);

    expect(runtime.result?.chapterId).toBe('ch1');
    expect(runtime.result?.time).toBeCloseTo(42.5, 5);
    expect(runtime.result?.shards).toBe(2);
    expect(runtime.result?.deaths).toBe(2);
    expect(runtime.save.chapters.ch1.done).toBe(true);
    expect(runtime.save.chapters.ch1.bestTime).toBeCloseTo(42.5, 5);
    expect(runtime.save.chapters.ch1.shards).toEqual(['s1-1', 's1-2']);
    expect(runtime.save.shards).toEqual(['s1-1', 's1-2']);
    expect(saves).toHaveLength(1);

    expect(runtime.canStart('ch2')).toBe(true);
    expect(runtime.canStart('ch3')).toBe(false);
    expect(runtime.continueChapter()?.id).toBe('ch2');
    expect(runtime.nextChapter()?.id).toBe('ch2');
  });

  it('keeps the best time on replay and merges new shards', () => {
    const { runtime } = makeRuntime();
    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.story!.elapsed = 50;
    runtime.story!.shards['s1-1'] = true;
    runtime.step(idle, 1 / 60);

    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.story!.elapsed = 40;
    runtime.story!.shards['s1-2'] = true;
    runtime.step(idle, 1 / 60);

    expect(runtime.save.chapters.ch1.bestTime).toBe(40);
    expect(runtime.save.chapters.ch1.shards).toEqual(['s1-1', 's1-2']);
  });

  it('refuses locked and disabled chapters', () => {
    const { runtime } = makeRuntime();
    expect(runtime.openBriefing('ch2')).toBe(false);
    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.step(idle, 1 / 60);
    expect(runtime.openBriefing('ch2')).toBe(true);
    expect(runtime.openBriefing('ch4')).toBe(false);
  });

  it('opens the next chapter after a debrief', () => {
    const { runtime } = makeRuntime();
    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.step(idle, 1 / 60);
    runtime.showDebrief();
    expect(runtime.screen).toBe('debrief');
    expect(runtime.openNext()).toBe(true);
    expect(runtime.screen).toBe('playing');
    expect(runtime.chapterId).toBe('ch2');
  });

  it('marks the amulet only when all twelve shards are collected', () => {
    const save = defaultSave();
    save.shards = Array.from({ length: 9 }, (_, index) => `old-${index}`);
    const { runtime } = makeRuntime(save);
    runtime.openBriefing('ch1');
    runtime.begin();
    runtime.story!.phase = 'complete';
    runtime.story!.shards['s1-1'] = true;
    runtime.story!.shards['s1-2'] = true;
    runtime.step(idle, 1 / 60);
    expect(runtime.save.amulet).toBe(false);
    expect(runtime.save.shards).toHaveLength(11);
  });
});
