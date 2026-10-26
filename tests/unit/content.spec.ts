import { describe, expect, it } from 'vitest';
import {
  CHAPTERS,
  buildTuning,
  enabledChapters,
  getChapter,
  validateChapters
} from '../../src/content3';
import { getLang, localized, setLang, t } from '../../src/core/i18n';

describe('chapter content', () => {
  it('is valid, with eight chapters and a contiguous enabled prefix', () => {
    expect(validateChapters()).toEqual([]);
    expect(CHAPTERS).toHaveLength(8);
    expect(enabledChapters().map((chapter) => chapter.id)).toEqual(['ch1', 'ch2', 'ch3']);
  });

  it('has twelve memory shards across the enabled chapters', () => {
    const shards = enabledChapters().flatMap((chapter) => chapter.shards ?? []);
    expect(shards).toHaveLength(12);
    expect(new Set(shards.map((shard) => shard.id)).size).toBe(12);
  });

  it('gives every shipped string an English and a Telugu version', () => {
    for (const chapter of enabledChapters()) {
      expect(chapter.title.en.length).toBeGreaterThan(0);
      expect(chapter.title.te.length).toBeGreaterThan(0);
      for (const objective of chapter.objectives) {
        expect(objective.label.te.length).toBeGreaterThan(0);
      }
      for (const shard of chapter.shards ?? []) {
        expect(shard.caption.te.length).toBeGreaterThan(0);
      }
      for (const card of chapter.cards) {
        expect(card.body.te.length).toBeGreaterThan(0);
      }
    }
  });

  it('never ships the film title in content', () => {
    expect(JSON.stringify(CHAPTERS).toLowerCase()).not.toContain('eega');
  });

  it('merges chapter tuning over the baseline', () => {
    const chapter = getChapter('ch3');
    expect(chapter).toBeDefined();
    const tuning = buildTuning(chapter!);
    expect(tuning.player.speed).toBe(12);
    expect(tuning.arenaRadius).toBe(24);
    expect(tuning.player.lives).toBe(3);
    expect(tuning.sting.range).toBe(10);
  });

  it('catches a broken chapter', () => {
    const broken = structuredClone(CHAPTERS);
    broken[0].objectives[0].label.te = '';
    broken[1].shards = [];
    const errors = validateChapters(broken);
    expect(errors.some((error) => error.includes('label needs EN+TE'))).toBe(true);
    expect(errors.some((error) => error.includes('12 shards'))).toBe(true);
  });
});

describe('i18n', () => {
  it('switches language and localises content', () => {
    setLang('en');
    expect(t('fly')).toBe('Fly');
    expect(localized({ en: 'Lane', te: 'వీధి' })).toBe('Lane');
    setLang('te');
    expect(getLang()).toBe('te');
    expect(t('fly')).toBe('ఎగరండి');
    expect(localized({ en: 'Lane', te: 'వీధి' })).toBe('వీధి');
    setLang('en');
  });
});
