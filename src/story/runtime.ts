import { CHAPTERS, getChapter, type ChapterDef, type LocalizedText } from '../content3';
import {
  advanceStory,
  collectedShardIds,
  consumeEvents,
  createStoryState,
  totalShards,
  type StoryEvent,
  type StoryState
} from '../sim3d/story';
import { mergeShardIds, type ChapterProgress, type SaveData } from '../core/save';
import type { FlyInput } from '../sim3d/flight';

export type Screen = 'title' | 'select' | 'briefing' | 'playing' | 'paused' | 'debrief';

export interface RuntimeResult {
  chapterId: string;
  time: number;
  shards: number;
  total: number;
  deaths: number;
}

export interface SelectCard {
  id: string;
  order: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  locked: boolean;
  done: boolean;
  shards: number;
  total: number;
  bestTime: number;
}

/** Owns story progression and saves. DOM-free; main binds it to the HUD. */
export class StoryRuntime {
  screen: Screen = 'title';
  save: SaveData;
  chapterId: string | null = null;
  story: StoryState | null = null;
  selectedId: string | null = null;
  result: RuntimeResult | null = null;

  private readonly seed: () => number;
  private readonly onSave: (save: SaveData) => void;
  private acc = 0;
  private finalized = false;

  constructor(save: SaveData, seed: () => number, onSave: (save: SaveData) => void = () => undefined) {
    this.save = save;
    this.seed = seed;
    this.onSave = onSave;
  }

  get chapter(): ChapterDef | null {
    return this.chapterId ? getChapter(this.chapterId) ?? null : null;
  }

  allChapters(): ChapterDef[] {
    return CHAPTERS;
  }

  progress(id: string): ChapterProgress | undefined {
    return this.save.chapters[id];
  }

  isUnlocked(id: string): boolean {
    const chapter = getChapter(id);
    if (!chapter) return false;
    if (chapter.order === 1) return true;
    const previous = CHAPTERS.find((candidate) => candidate.order === chapter.order - 1);
    return previous ? this.save.chapters[previous.id]?.done === true : false;
  }

  canStart(id: string): boolean {
    const chapter = getChapter(id);
    return Boolean(chapter?.enabled && this.isUnlocked(id));
  }

  continueChapter(): ChapterDef | null {
    const next = CHAPTERS.find((chapter) => chapter.enabled && !this.save.chapters[chapter.id]?.done);
    if (next) {
      // Only offer it if its predecessor is done (or it is first).
      return this.isUnlocked(next.id) ? next : null;
    }
    const done = CHAPTERS.filter((chapter) => chapter.enabled && this.save.chapters[chapter.id]?.done);
    return done.length > 0 ? done[done.length - 1] : null;
  }

  cardFor(id: string, kind: 'intro' | 'mid' | 'outro') {
    const chapter = getChapter(id);
    return chapter?.cards.find((card) => card.at === kind);
  }

  openSelect(): void {
    this.screen = 'select';
  }

  openBriefing(id: string): boolean {
    if (!this.canStart(id)) return false;
    const chapter = getChapter(id);
    if (!chapter) return false;
    this.chapterId = id;
    this.selectedId = id;
    this.story = createStoryState(this.seed(), chapter);
    this.acc = 0;
    this.result = null;
    this.finalized = false;
    this.screen = 'briefing';
    return true;
  }

  begin(): void {
    if (this.screen === 'briefing' && this.story) this.screen = 'playing';
  }

  start(id: string): boolean {
    if (!this.openBriefing(id)) return false;
    this.begin();
    return true;
  }

  startFromBriefing(): void {
    this.begin();
  }

  pause(): void {
    if (this.screen === 'playing') this.screen = 'paused';
  }

  resume(): void {
    if (this.screen === 'paused') this.screen = 'playing';
  }

  restart(): boolean {
    if (!this.chapterId) return false;
    const id = this.chapterId;
    return this.start(id);
  }

  step(input: FlyInput, dt: number): StoryEvent[] {
    if (this.screen !== 'playing' || !this.story) return [];
    const result = advanceStory(this.story, input, dt, this.acc);
    this.acc = result.acc;
    const events = consumeEvents(this.story);
    if (this.story.phase === 'complete') this.finalize();
    return events;
  }

  private finalize(): void {
    if (this.finalized || !this.story || !this.chapterId) return;
    this.finalized = true;
    const chapter = getChapter(this.chapterId);
    if (!chapter) return;

    const found = collectedShardIds(this.story);
    const previous = this.save.chapters[chapter.id];
    const bestTime =
      previous && previous.bestTime > 0
        ? Math.min(previous.bestTime, this.story.elapsed)
        : this.story.elapsed;

    this.save = {
      ...this.save,
      chapters: {
        ...this.save.chapters,
        [chapter.id]: {
          done: true,
          bestTime,
          shards: mergeShardIds(previous?.shards ?? [], found),
          deaths: this.story.deaths
        }
      },
      shards: mergeShardIds(this.save.shards, found)
    };
    this.save.amulet = this.save.shards.length >= 12;
    this.onSave(this.save);

    this.result = {
      chapterId: chapter.id,
      time: this.story.elapsed,
      shards: found.length,
      total: totalShards(this.story),
      deaths: this.story.deaths
    };
  }

  showDebrief(): void {
    if (this.result) this.screen = 'debrief';
  }

  nextChapter(): ChapterDef | null {
    const current = this.chapter;
    if (!current) return null;
    const next = CHAPTERS.find((chapter) => chapter.order === current.order + 1 && chapter.enabled);
    return next && this.canStart(next.id) ? next : null;
  }

  openNext(): boolean {
    const next = this.nextChapter();
    if (!next) return false;
    return this.start(next.id);
  }

  returnToTitle(): void {
    this.screen = 'title';
  }

  selectCards(): SelectCard[] {
    return CHAPTERS.map((chapter) => {
      const progress = this.save.chapters[chapter.id];
      return {
        id: chapter.id,
        order: chapter.order,
        title: chapter.title,
        subtitle: chapter.subtitle,
        locked: !this.canStart(chapter.id),
        done: progress?.done === true,
        shards: progress?.shards.length ?? 0,
        total: chapter.shards?.length ?? 0,
        bestTime: progress?.bestTime ?? 0
      };
    });
  }
}
