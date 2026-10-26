export interface SaveData {
  v: 1;
  muted: boolean;
  best: number;
}

export const SAVE_KEY = 'egara3d.save';

export function defaultSave(): SaveData {
  return { v: 1, muted: false, best: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pure, tolerant parser: bad data never throws. */
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
  if (typeof parsed.best === 'number' && Number.isFinite(parsed.best) && parsed.best >= 0) {
    save.best = Math.floor(parsed.best);
  }
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
