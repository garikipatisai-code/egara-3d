import type { Lang } from './i18n';

export interface ChapterProgress {
  done: boolean;
  bestTime: number;
  shards: string[];
  deaths: number;
}

export interface SaveData {
  v: 2;
  muted: boolean;
  lang: Lang;
  best: number;
  chapters: Record<string, ChapterProgress>;
  shards: string[];
  amulet: boolean;
}

export const SAVE_KEY = 'egara3d.save';

export function defaultSave(): SaveData {
  return { v: 2, muted: false, lang: 'en', best: 0, chapters: {}, shards: [], amulet: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readShards(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry === 'string' && entry.length > 0) seen.add(entry);
  }
  return [...seen];
}

function readChapters(value: unknown): Record<string, ChapterProgress> {
  if (!isRecord(value)) return {};
  const chapters: Record<string, ChapterProgress> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw)) continue;
    chapters[id] = {
      done: raw.done === true,
      bestTime: readNumber(raw.bestTime),
      shards: readShards(raw.shards),
      deaths: Math.floor(readNumber(raw.deaths))
    };
  }
  return chapters;
}

/** Pure, tolerant parser: bad data never throws. Migrates v1 saves. */
export function parseSave(raw: string | null): SaveData {
  const save = defaultSave();
  if (!raw) return save;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return save;
  }
  if (!isRecord(parsed)) return save;

  if (typeof parsed.muted === 'boolean') save.muted = parsed.muted;
  if (parsed.lang === 'en' || parsed.lang === 'te') save.lang = parsed.lang;
  save.best = Math.floor(readNumber(parsed.best));
  save.chapters = readChapters(parsed.chapters);
  save.shards = readShards(parsed.shards);
  save.amulet = parsed.amulet === true;
  return save;
}

export function loadSave(): SaveData {
  try {
    return parseSave(globalThis.localStorage.getItem(SAVE_KEY));
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData): void {
  try {
    globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode: the game keeps running unsaved.
  }
}

export function mergeShardIds(existing: string[], found: string[]): string[] {
  return [...new Set([...existing, ...found])];
}
