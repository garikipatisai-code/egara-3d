import { Stage } from './render3/stage';
import { InputMap } from './core/input';
import { AudioController } from './core/audio';
import { loadSave, persistSave, type SaveData } from './core/save';
import { localized, setLang, t, toggleLang } from './core/i18n';
import { createHud } from './ui/hud';
import { StoryRuntime } from './story/runtime';
import { collectedShardIds, currentObjective, totalShards, type StoryEvent } from './sim3d/story';
import { consumeBumps } from './sim3d/flight';

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

const forcedQuality = new URLSearchParams(window.location.search).get('quality');
let qualityLocked = forcedQuality === 'high' || forcedQuality === 'low';
if (qualityLocked) save = { ...save, quality: forcedQuality as 'high' | 'low' };
// Automated browsers use the fast tier so shader compilation cannot time tests out.
if (!qualityLocked && navigator.webdriver) {
  save = { ...save, quality: 'low' };
  persistSave(save);
}

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
  stage.setQuality(save.quality);
} catch {
  hud.showFatal(t('webglTitle'), t('webglBody'), t('retry'), () => window.location.reload());
  throw new Error('Egara 3D requires WebGL');
}
let quality: 'high' | 'low' = save.quality;

input.attachTouch({
  canvas,
  stick: hud.touch.stick,
  cap: hud.touch.cap,
  sting: hud.touch.sting,
  boost: hud.touch.boost,
  up: hud.touch.up,
  down: hud.touch.down,
  perch: hud.touch.perch,
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
let slowTime = 0;
let lastPerched = false;

function showTitle(): void {
  runtime.returnToTitle();
  audio.setScene('menu');
  stage.loadHub();
  const next = runtime.continueChapter();
  hud.showTitle({
    hasContinue: next !== null,
    amulet: save.amulet,
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
    amulet: save.amulet,
    onPick: openBriefing,
    onBack: showTitle,
    onLang: switchLanguage,
    onMute: switchMute
  });
}

function audioSceneFor(location: string): 'lane' | 'airport' | 'workshop' | 'house' | 'ritual' | 'finale' {
  if (location === 'airport-road') return 'airport';
  if (location === 'garva-house' || location === 'ledger-room') return 'house';
  if (location === 'diviner-room') return 'ritual';
  if (location === 'glass-house') return 'finale';
  if (location === 'workshop') return 'workshop';
  return 'lane';
}

function openBriefing(id: string): void {
  if (!runtime.openBriefing(id)) return;
  const chapter = runtime.chapter;
  if (!chapter) return;
  cardOpen = false;
  hud.hideCard();
  audio.setScene(audioSceneFor(chapter.location));
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
  lastPerched = false;
  const chapter = runtime.chapter;
  if (chapter) audio.setScene(audioSceneFor(chapter.location));
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
    },
    quality,
    onToggleQuality: toggleQuality
  });
}

function toggleQuality(): void {
  quality = quality === 'high' ? 'low' : 'high';
  // An explicit choice wins over auto-fallback for this session.
  qualityLocked = true;
  save = { ...save, quality };
  persistSave(save);
  stage.setQuality(quality);
  qualityScale = 1;
  stage.setRenderScale(1);
  showPause();
}

function resumeChapter(): void {
  runtime.resume();
  const location = runtime.chapter?.location;
  if (location) audio.setScene(audioSceneFor(location));
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
  const isFinale = chapter.id === 'ch8';
  const next = isFinale ? null : runtime.nextChapter();
  hud.showDebrief({
    chapter,
    result,
    nextTitle: isFinale ? t('epilogue') : next ? localized(next.title) : null,
    nextActionLabel: isFinale ? t('epilogue') : t('nextChapter'),
    amulet: save.amulet,
    onNext: () => {
      if (isFinale) {
        showEpilogue();
        return;
      }
      const nextChapter = runtime.nextChapter();
      if (nextChapter) openBriefing(nextChapter.id);
    },
    onChapters: showSelect,
    onLang: switchLanguage
  });
}

function showEpilogue(): void {
  audio.setScene('menu');
  hud.showEpilogue({
    amulet: save.amulet,
    onClose: showTitle
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
  const player = story.world.player;
  canvas.dataset.speed = player.speed.toFixed(2);
  canvas.dataset.perched = String(player.perched);
  canvas.dataset.altitude = player.pos.y.toFixed(2);
  if (player.perched !== lastPerched) {
    lastPerched = player.perched;
    hud.toast(player.perched ? t('perched') : t('airborne'));
  }
  const objective = currentObjective(story);
  hud.setObjective(objective ? localized(objective.label) : '');
  hud.setShards(collectedShardIds(story).length, totalShards(story));
  hud.setLives(story.lives);
  hud.setParanoia(story.paranoia);
  const boss = story.chapter.boss;
  if (boss && objective?.kind === 'boss') {
    hud.setBoss(
      localized(boss.name),
      Math.min(story.objectiveProgress, objective.count ?? boss.nodes),
      objective.count ?? boss.nodes
    );
  } else {
    hud.hideBoss();
  }
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
    } else if (event.type === 'node') {
      const pos = runtime.story?.world.player.pos;
      if (pos) stage.burst(pos.x, pos.y, pos.z, true);
      stage.punch();
      audio.play('hit');
    } else if (event.type === 'wingClip') {
      const pos = runtime.story?.world.player.pos;
      if (pos) stage.burst(pos.x, pos.y, pos.z, true);
      stage.hurtShake();
      audio.play('hit');
      hud.toast(t('oneWing'));
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
    const tickBefore = runtime.story.world.tick;
    const polled = input.poll();
    canvas.dataset.perchInput = String(polled.perch === true);
    const events = runtime.step(polled, dt);
    if (runtime.story.world.tick > tickBefore) input.consumePerch();
    handleEvents(events);
    const bumps = consumeBumps(runtime.story.world);
    for (const bump of bumps) {
      stage.burst(bump.x, bump.y, bump.z, bump.strength > 4);
      stage.hurtShake();
      audio.play('hit');
    }
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
      if (!qualityLocked && quality === 'high' && fps < 50) {
        slowTime += 0.5;
        if (slowTime >= 1) {
          quality = 'low';
          save = { ...save, quality };
          persistSave(save);
          stage.setQuality('low');
          qualityScale = 1;
          stage.setRenderScale(1);
          hud.toast(t('graphicsLow'));
        }
      } else {
        slowTime = 0;
      }
      const floor = quality === 'low' ? 0.5 : 0.65;
      if (fps < 55 && qualityScale > floor) {
        qualityScale = Math.max(floor, qualityScale - 0.1);
        stage.setRenderScale(qualityScale);
      } else if (fps > 57 && qualityScale < 1) {
        qualityScale = Math.min(1, qualityScale + 0.05);
        stage.setRenderScale(qualityScale);
      }
    }
    canvas.dataset.renderScale = stage.renderScaleValue.toFixed(2);
    canvas.dataset.quality = quality;
    frames = 0;
    fpsTime = 0;
  }
  if (runtime.screen === 'playing') syncHud();
}

showTitle();
requestAnimationFrame(frame);
