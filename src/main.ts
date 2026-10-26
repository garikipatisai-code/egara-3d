import { Stage } from './render3/stage';
import { InputMap } from './core/input';
import { AudioController } from './core/audio';
import { loadSave, persistSave, type SaveData } from './core/save';
import { localized, setLang, t, toggleLang } from './core/i18n';
import { createHud } from './ui/hud';
import { StoryRuntime } from './story/runtime';
import { collectedShardIds, currentObjective, totalShards, type StoryEvent } from './sim3d/story';

function randomSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const hud = createHud();
const input = new InputMap();
input.attach(window);

let save: SaveData = loadSave();
setLang(save.lang);

const audio = new AudioController({
  muted: save.muted,
  onMute: (muted) => {
    save = { ...save, muted };
    persistSave(save);
  }
});
hud.setMuted(save.muted);
hud.onMute(() => {
  hud.setMuted(audio.toggleMute());
});
let stage: Stage;
try {
  stage = new Stage(canvas);
} catch {
  hud.showFatal(t('webglTitle'), t('webglBody'), t('retry'), () => window.location.reload());
  throw new Error('Egara 3D requires WebGL');
}

input.attachTouch({
  canvas,
  stick: hud.touch.stick,
  cap: hud.touch.cap,
  sting: hud.touch.sting,
  boost: hud.touch.boost,
  onLook: (dx, dy) => stage.look(dx, dy)
});

const reducedMotionQuery =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
let shakeOn = !(reducedMotionQuery?.matches ?? false);
stage.setReducedMotion(!shakeOn);

const runtime = new StoryRuntime(save, randomSeed, (next) => {
  save = next;
  persistSave(save);
});

let cardOpen = false;
let last = performance.now();
let frames = 0;
let fpsTime = 0;
let qualityScale = 1;

function showTitle(): void {
  runtime.returnToTitle();
  audio.setScene('menu');
  stage.loadHub();
  const next = runtime.continueChapter();
  hud.showTitle({
    hasContinue: next !== null,
    onStart: () => openBriefing('ch1'),
    onContinue: () => {
      if (next) openBriefing(next.id);
    },
    onChapters: showSelect,
    onLang: switchLanguage,
    onMute: switchMute
  });
}

function showSelect(): void {
  runtime.openSelect();
  audio.setScene('menu');
  stage.loadHub();
  hud.showSelect({
    cards: runtime.selectCards(),
    onPick: openBriefing,
    onBack: showTitle,
    onLang: switchLanguage,
    onMute: switchMute
  });
}

function openBriefing(id: string): void {
  if (!runtime.openBriefing(id)) return;
  const chapter = runtime.chapter;
  if (!chapter) return;
  cardOpen = false;
  hud.hideCard();
  audio.setScene(chapter.location === 'workshop' ? 'workshop' : 'lane');
  stage.loadChapter(chapter);
  stage.sync(runtime.story, 0);
  hud.showBriefing({
    chapter,
    onFly: beginChapter,
    onBack: showSelect,
    onLang: switchLanguage,
    onMute: switchMute
  });
}

function beginChapter(): void {
  runtime.begin();
  if (runtime.story) {
    // The briefing already showed the intro card; discard its queued copy.
    runtime.story.events.length = 0;
  }
  cardOpen = false;
  const chapter = runtime.chapter;
  audio.setScene(chapter?.location === 'workshop' ? 'workshop' : 'lane');
  audio.setTension(0);
  hud.showPlaying();
  syncHud();
}

function showPause(): void {
  runtime.pause();
  audio.setScene('menu');
  hud.showPause({
    onResume: resumeChapter,
    onRestart: restartChapter,
    onChapters: showSelect,
    onLang: switchLanguage,
    onMute: switchMute,
    shakeOn,
    onToggleShake: () => {
      shakeOn = !shakeOn;
      stage.setReducedMotion(!shakeOn);
      showPause();
    }
  });
}

function resumeChapter(): void {
  runtime.resume();
  audio.setScene(runtime.chapter?.location === 'workshop' ? 'workshop' : 'lane');
  hud.showPlaying();
}

function restartChapter(): void {
  const id = runtime.chapterId;
  if (id) openBriefing(id);
}

function showDebrief(): void {
  const chapter = runtime.chapter;
  const result = runtime.result;
  if (!chapter || !result) {
    showSelect();
    return;
  }
  audio.setScene('menu');
  runtime.showDebrief();
  const next = runtime.nextChapter();
  hud.showDebrief({
    chapter,
    result,
    nextTitle: next ? localized(next.title) : null,
    onNext: () => {
      const nextChapter = runtime.nextChapter();
      if (nextChapter) openBriefing(nextChapter.id);
    },
    onChapters: showSelect,
    onLang: switchLanguage
  });
}

function switchLanguage(): void {
  const lang = toggleLang();
  save = { ...save, lang };
  persistSave(save);
  hud.setMuted(audio.isMuted());
  renderCurrent();
}

function switchMute(): void {
  hud.setMuted(audio.toggleMute());
}

function renderCurrent(): void {
  switch (runtime.screen) {
    case 'title':
      showTitle();
      break;
    case 'select':
      showSelect();
      break;
    case 'briefing': {
      const chapter = runtime.chapter;
      if (!chapter) {
        showSelect();
        break;
      }
      hud.showBriefing({
        chapter,
        onFly: beginChapter,
        onBack: showSelect,
        onLang: switchLanguage,
        onMute: switchMute
      });
      break;
    }
    case 'playing':
      hud.showPlaying();
      syncHud();
      break;
    case 'paused':
      showPause();
      break;
    case 'debrief':
      showDebrief();
      break;
  }
}

function syncHud(): void {
  const story = runtime.story;
  if (!story) return;
  const objective = currentObjective(story);
  hud.setObjective(objective ? localized(objective.label) : '');
  hud.setShards(collectedShardIds(story).length, totalShards(story));
  hud.setLives(story.lives);
  hud.setParanoia(story.paranoia);
}

function handleEvents(events: StoryEvent[]): void {
  const chapter = runtime.chapter;
  if (!chapter) return;

  for (const event of events) {
    if (event.type === 'card') {
      const card = chapter.cards.find((candidate) => candidate.id === event.id);
      if (!card) continue;
      cardOpen = true;
      hud.showCard(card, () => {
        cardOpen = false;
        hud.hideCard();
        if (runtime.result) {
          showDebrief();
        }
      });
    } else if (event.type === 'shard') {
      const shard = chapter.shards?.find((candidate) => candidate.id === event.id);
      audio.play('sting');
      stage.burst(event.pos.x, event.pos.y, event.pos.z, true);
      hud.toast(shard ? `${t('shardFound')} — ${localized(shard.caption)}` : t('shardFound'));
    } else if (event.type === 'objective') {
      audio.play('sting');
      syncHud();
    } else if (event.type === 'hurt') {
      audio.play('hit');
      stage.hurtShake();
    } else if (event.type === 'respawn') {
      hud.toast(t('respawned'));
    } else if (event.type === 'kill') {
      stage.burst(event.pos.x, event.pos.y, event.pos.z, false);
      stage.punch();
      audio.play('hit');
    } else if (event.type === 'write') {
      stage.burst(runtime.story?.world.player.pos.x ?? 0, runtime.story?.world.player.pos.y ?? 0, runtime.story?.world.player.pos.z ?? 0, false);
      audio.play('sting');
    } else if (event.type === 'complete') {
      audio.play('win');
    }
  }
}

hud.onPause(() => {
  if (runtime.screen === 'playing') showPause();
  else if (runtime.screen === 'paused') resumeChapter();
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  stage.zoom(event.deltaY > 0 ? 0.08 : -0.08);
}, { passive: false });

let dragging = false;
let lastPX = 0;
let lastPY = 0;
canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse') return;
  dragging = true;
  lastPX = event.clientX;
  lastPY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging || event.pointerType !== 'mouse') return;
  stage.look(event.clientX - lastPX, event.clientY - lastPY);
  lastPX = event.clientX;
  lastPY = event.clientY;
});
const endDrag = () => {
  dragging = false;
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

const unlock = () => {
  audio.unlock();
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;

  if (input.consumePause() && !cardOpen) {
    if (runtime.screen === 'playing') showPause();
    else if (runtime.screen === 'paused') resumeChapter();
  }

  if (runtime.screen === 'playing' && runtime.story && !cardOpen) {
    const events = runtime.step(input.poll(), dt);
    handleEvents(events);
    audio.setTension(runtime.story.paranoia / 100);
    const hasOutro = runtime.chapter?.cards.some((card) => card.at === 'outro');
    if (runtime.result && !hasOutro) showDebrief();
  }

  stage.sync(runtime.story, dt);
  stage.render(dt);

  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    const fps = frames / fpsTime;
    hud.setFps(fps);
    canvas.dataset.fps = String(Math.round(fps));
    canvas.dataset.drawCalls = String(stage.fpsDrawCalls);
    if (runtime.screen === 'playing' && !cardOpen) {
      if (fps < 48 && qualityScale > 0.65) {
        qualityScale = Math.max(0.65, qualityScale - 0.1);
        stage.setRenderScale(qualityScale);
      } else if (fps > 57 && qualityScale < 1) {
        qualityScale = Math.min(1, qualityScale + 0.05);
        stage.setRenderScale(qualityScale);
      }
    }
    canvas.dataset.renderScale = stage.renderScaleValue.toFixed(2);
    frames = 0;
    fpsTime = 0;
  }
  if (runtime.screen === 'playing') syncHud();
}

showTitle();
requestAnimationFrame(frame);
