import raw from './chapters.json';
import type {
  ChapterDef,
  ChapterTuningDef,
  LocalizedText,
  ObjectiveDef
} from './types';
import type { Tuning } from '../sim3d/flight';

export type {
  ChapterDef,
  ObjectiveDef,
  ShardDef,
  CardDef,
  HazardDef,
  LocalizedText,
  Vec3Data,
  ActorDef,
  BossDef
} from './types';

export const CHAPTERS = raw as ChapterDef[];

/** Shared baseline; chapters override only what the space needs. */
export const BASE_TUNING: Tuning = {
  arenaRadius: 120,
  minAltitude: 2,
  maxAltitude: 40,
  runSeconds: 3600,
  player: {
    speed: 14,
    boost: 10,
    yawRate: 2.2,
    pitchLimit: 0.6,
    radius: 1,
    lives: 3,
    invulnFrames: 60
  },
  sting: { range: 10, cooldownFrames: 10, damage: 1 },
  foe: { hp: 2, radius: 1.6, speed: 6, score: 100 },
  pools: { foes: 12 },
  waves: { intervalSeconds: 3600, count: 0 }
};

export function getChapter(id: string): ChapterDef | undefined {
  return CHAPTERS.find((chapter) => chapter.id === id);
}

export function enabledChapters(): ChapterDef[] {
  return CHAPTERS.filter((chapter) => chapter.enabled).sort((a, b) => a.order - b.order);
}

export function buildTuning(chapter: ChapterDef): Tuning {
  const t: ChapterTuningDef = chapter.tuning ?? {};
  return {
    ...BASE_TUNING,
    arenaRadius: t.arenaRadius ?? chapter.bounds.radius,
    minAltitude: t.minAltitude ?? chapter.bounds.minY,
    maxAltitude: t.maxAltitude ?? chapter.bounds.maxY,
    player: {
      ...BASE_TUNING.player,
      speed: t.speed ?? BASE_TUNING.player.speed,
      boost: t.boost ?? BASE_TUNING.player.boost,
      yawRate: t.yawRate ?? BASE_TUNING.player.yawRate,
      pitchLimit: t.pitchLimit ?? BASE_TUNING.player.pitchLimit,
      lives: t.lives ?? BASE_TUNING.player.lives,
      invulnFrames: t.invulnFrames ?? BASE_TUNING.player.invulnFrames
    }
  };
}

function hasText(text: LocalizedText | undefined): boolean {
  return Boolean(text && text.en.trim().length > 0 && text.te.trim().length > 0);
}

function checkObjective(objective: ObjectiveDef, chapterId: string, errors: string[]): void {
  if (!hasText(objective.label)) errors.push(`${chapterId}/${objective.id}: label needs EN+TE`);
  if (objective.kind === 'reach') {
    if (!objective.target) errors.push(`${chapterId}/${objective.id}: reach needs target`);
    if ((objective.radius ?? 0) <= 0) errors.push(`${chapterId}/${objective.id}: reach needs radius`);
  }
  if (objective.kind === 'collect') {
    if (!objective.shardIds || objective.shardIds.length === 0) {
      errors.push(`${chapterId}/${objective.id}: collect needs shardIds`);
    }
  }
  if (objective.kind === 'survive' && (objective.seconds ?? 0) <= 0) {
    errors.push(`${chapterId}/${objective.id}: survive needs seconds`);
  }
  if (objective.kind === 'write') {
    if (!objective.marks || objective.marks.length < 2) {
      errors.push(`${chapterId}/${objective.id}: write needs 2+ marks`);
    }
  }
  if (objective.kind === 'destroy' && (objective.count ?? 0) <= 0) {
    errors.push(`${chapterId}/${objective.id}: destroy needs count`);
  }
  if (objective.kind === 'escort') {
    if (!objective.actorId) errors.push(`${chapterId}/${objective.id}: escort needs actorId`);
    if ((objective.seconds ?? 0) <= 0) errors.push(`${chapterId}/${objective.id}: escort needs seconds`);
    if ((objective.radius ?? 0) <= 0) errors.push(`${chapterId}/${objective.id}: escort needs radius`);
  }
  if (objective.kind === 'sabotage' || objective.kind === 'boss') {
    if (!objective.targets || objective.targets.length < 2) {
      errors.push(`${chapterId}/${objective.id}: ${objective.kind} needs 2+ targets`);
    }
    if ((objective.count ?? 0) <= 0) errors.push(`${chapterId}/${objective.id}: ${objective.kind} needs count`);
    if ((objective.radius ?? 0) <= 0) errors.push(`${chapterId}/${objective.id}: ${objective.kind} needs radius`);
  }
}

function insideBounds(chapter: ChapterDef, x: number, y: number, z: number): boolean {
  return (
    Math.hypot(x, z) <= chapter.bounds.radius + 1e-6 &&
    y >= chapter.bounds.minY - 1e-6 &&
    y <= chapter.bounds.maxY + 1e-6
  );
}

/** Pure content validation. Returns human-readable errors; empty means valid. */
export function validateChapters(defs: ChapterDef[] = CHAPTERS): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const shardIds = new Set<string>();

  defs.forEach((chapter, index) => {
    if (ids.has(chapter.id)) errors.push(`duplicate chapter id: ${chapter.id}`);
    ids.add(chapter.id);
    if (chapter.order !== index + 1) errors.push(`${chapter.id}: order must be ${index + 1}`);

    if (!hasText(chapter.title)) errors.push(`${chapter.id}: title needs EN+TE`);
    if (!hasText(chapter.subtitle)) errors.push(`${chapter.id}: subtitle needs EN+TE`);
    if (!insideBounds(chapter, chapter.spawn.pos.x, chapter.spawn.pos.y, chapter.spawn.pos.z)) {
      errors.push(`${chapter.id}: spawn outside bounds`);
    }
    if (chapter.objectives.length === 0) errors.push(`${chapter.id}: no objectives`);

    if (chapter.boss) {
      if (!hasText(chapter.boss.name)) errors.push(`${chapter.id}: boss name needs EN+TE`);
      if (chapter.boss.nodes <= 0) errors.push(`${chapter.id}: boss needs nodes`);
    }

    for (const actor of chapter.actors ?? []) {
      if (!actor.id) errors.push(`${chapter.id}: actor needs id`);
      if (!actor.path || actor.path.length < 2) errors.push(`${chapter.id}/${actor.id}: actor needs a path`);
      if (actor.speed <= 0) errors.push(`${chapter.id}/${actor.id}: actor needs speed`);
    }

    const objectiveIds = new Set<string>();
    for (const objective of chapter.objectives) {
      if (objectiveIds.has(objective.id)) errors.push(`${chapter.id}: duplicate objective ${objective.id}`);
      objectiveIds.add(objective.id);
      checkObjective(objective, chapter.id, errors);
    }

    for (const card of chapter.cards) {
      if (!hasText(card.body)) errors.push(`${chapter.id}/${card.id}: card needs EN+TE`);
    }

    for (const shard of chapter.shards ?? []) {
      if (shardIds.has(shard.id)) errors.push(`duplicate shard id: ${shard.id}`);
      shardIds.add(shard.id);
      if (!hasText(shard.caption)) errors.push(`${chapter.id}/${shard.id}: caption needs EN+TE`);
      if (!insideBounds(chapter, shard.pos.x, shard.pos.y, shard.pos.z)) {
        errors.push(`${chapter.id}/${shard.id}: outside bounds`);
      }
    }

    for (const hazard of chapter.hazards ?? []) {
      if (!insideBounds(chapter, hazard.pos.x, hazard.pos.y, hazard.pos.z)) {
        errors.push(`${chapter.id}/${hazard.id}: outside bounds`);
      }
      if (
        hazard.activeAfterObjective !== undefined &&
        (hazard.activeAfterObjective < 0 || hazard.activeAfterObjective >= chapter.objectives.length)
      ) {
        errors.push(`${chapter.id}/${hazard.id}: activeAfterObjective out of range`);
      }
    }

    for (const next of chapter.unlock) {
      if (!defs.some((candidate) => candidate.id === next)) {
        errors.push(`${chapter.id}: unlock points at unknown ${next}`);
      }
    }
  });

  const enabled = defs.filter((chapter) => chapter.enabled);
  const firstDisabled = defs.findIndex((chapter) => !chapter.enabled);
  if (firstDisabled !== -1 && defs.slice(firstDisabled).some((chapter) => chapter.enabled)) {
    errors.push('enabled chapters must be a contiguous prefix');
  }
  const shardCount = enabled.reduce((sum, chapter) => sum + (chapter.shards?.length ?? 0), 0);
  if (shardCount !== 12) errors.push(`enabled chapters must contain 12 shards (found ${shardCount})`);
  if (enabled.some((chapter) => chapter.cards.length === 0)) {
    errors.push('enabled chapters need at least one card');
  }

  const serialized = JSON.stringify(defs).toLowerCase();
  if (serialized.includes('eega')) errors.push('shipped content must not use the film title');

  return errors;
}
