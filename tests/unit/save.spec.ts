import { describe, expect, it } from 'vitest';
import { defaultSave, mergeShardIds, parseSave } from '../../src/core/save';

describe('save v2', () => {
  it('migrates a v1 save without losing mute or best', () => {
    const save = parseSave(JSON.stringify({ v: 1, muted: true, best: 420 }));
    expect(save.v).toBe(2);
    expect(save.muted).toBe(true);
    expect(save.best).toBe(420);
    expect(save.lang).toBe('en');
    expect(save.chapters).toEqual({});
    expect(save.shards).toEqual([]);
    expect(save.amulet).toBe(false);
  });

  it('round-trips chapter progress and shards', () => {
    const save = parseSave(
      JSON.stringify({
        v: 2,
        muted: false,
        lang: 'te',
        best: 0,
        chapters: {
          ch1: { done: true, bestTime: 93.5, shards: ['s1-1', 's1-2'], deaths: 1 }
        },
        shards: ['s1-1', 's1-2'],
        amulet: false
      })
    );
    expect(save.lang).toBe('te');
    expect(save.chapters.ch1.done).toBe(true);
    expect(save.chapters.ch1.bestTime).toBe(93.5);
    expect(save.chapters.ch1.shards).toEqual(['s1-1', 's1-2']);
    expect(save.shards).toEqual(['s1-1', 's1-2']);
  });

  it('tolerates bad JSON, arrays and junk fields', () => {
    expect(parseSave('{nope')).toEqual(defaultSave());
    expect(parseSave('[]')).toEqual(defaultSave());
    expect(parseSave('null')).toEqual(defaultSave());
    const save = parseSave(
      JSON.stringify({
        v: 2,
        muted: 'yes',
        lang: 'fr',
        chapters: { ch1: 'bad', ch2: { done: 1, bestTime: -5, shards: [1, 'ok', 'ok'] } },
        shards: [1, 'a', 'a', null]
      })
    );
    expect(save.muted).toBe(false);
    expect(save.lang).toBe('en');
    expect(save.chapters.ch1).toBeUndefined();
    expect(save.chapters.ch2.done).toBe(false);
    expect(save.chapters.ch2.bestTime).toBe(0);
    expect(save.chapters.ch2.shards).toEqual(['ok']);
    expect(save.shards).toEqual(['a']);
  });

  it('merges shard ids without duplicates', () => {
    expect(mergeShardIds(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});
