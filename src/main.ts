import { advance, createWorld, type Tuning, type World } from './sim3d/flight';
import { buildArenaLayout } from './sim3d/arena';
import { Stage } from './render3/stage';
import { InputMap } from './core/input';
import { AudioController } from './core/audio';
import { loadSave, persistSave } from './core/save';
import { createHud } from './ui/hud';

const TUNING: Tuning = {
  arenaRadius: 120,
  minAltitude: 1,
  maxAltitude: 40,
  runSeconds: 90,
  player: { speed: 14, boost: 10, yawRate: 2.2, pitchLimit: 0.6, radius: 1, lives: 3, invulnFrames: 60 },
  sting: { range: 14, cooldownFrames: 8, damage: 1 },
  foe: { hp: 2, radius: 1.6, speed: 6, score: 100 },
  pools: { foes: 12 },
  waves: { intervalSeconds: 6, count: 2 }
};

function randomSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const hud = createHud();
const input = new InputMap();

const ARENA_SEED = 7;
const solids = buildArenaLayout(ARENA_SEED);

let stage: Stage;
try {
  stage = new Stage(canvas, solids);
} catch {
  hud.showMenu('WebGL unavailable', 'Egara 3D needs WebGL. Please try a recent Chrome, Edge, Firefox, or Safari with hardware acceleration on.', [
    { label: 'Retry', action: () => window.location.reload() }
  ]);
  throw new Error('Egara 3D requires WebGL');
}
input.attach(window);

let dragging = false;
let lastPX = 0;
let lastPY = 0;
canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastPX = event.clientX;
  lastPY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  stage.look(event.clientX - lastPX, event.clientY - lastPY);
  lastPX = event.clientX;
  lastPY = event.clientY;
});
const endDrag = () => {
  dragging = false;
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  stage.zoom(event.deltaY > 0 ? 0.08 : -0.08);
}, { passive: false });

let save = loadSave();
const audio = new AudioController({
  muted: save.muted,
  onMute: (muted) => {
    save = { ...save, muted };
    persistSave(save);
  }
});
hud.setMuted(save.muted);
hud.onMute(() => hud.setMuted(audio.toggleMute()));

let world: World = createWorld(randomSeed(), TUNING, solids);
let acc = 0;
let last = performance.now();
let paused = true;
let ended = false;
let lastScore = 0;
let lastLives = TUNING.player.lives;
let frames = 0;
let fpsTime = 0;

function startRun(): void {
  world = createWorld(randomSeed(), TUNING, solids);
  acc = 0;
  paused = false;
  ended = false;
  lastScore = 0;
  lastLives = TUNING.player.lives;
  hud.hideMenu();
}

hud.onPause(() => togglePause());

function togglePause(): void {
  if (ended) return;
  paused = !paused;
  if (paused) {
    hud.showMenu('Paused', '', [
      { label: 'Resume', action: () => startOrResume() },
      { label: 'Restart', action: () => startRun() }
    ]);
  } else {
    hud.hideMenu();
  }
}

function startOrResume(): void {
  paused = false;
  hud.hideMenu();
}

hud.showMenu('Egara 3D', 'WASD or arrows to fly · Space to sting · P to pause', [
  { label: 'Fly', action: () => startOrResume() }
]);

const unlock = () => {
  audio.unlock();
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

function endRun(won: boolean): void {
  ended = true;
  if (world.score > save.best) {
    save = { ...save, best: world.score };
    persistSave(save);
  }
  audio.play(won ? 'win' : 'lose');
  hud.showMenu(won ? 'Skies clear!' : 'Swatted.', `Score ${world.score} · Best ${save.best}`, [
    { label: 'Fly again', action: () => startRun() }
  ]);
}

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;

  if (input.consumePause() && !ended && world.tick > 0) {
    togglePause();
  }

  if (!paused && !ended) {
    const result = advance(world, input.poll(), dt, acc);
    acc = result.acc;

    if (world.score > lastScore) {
      lastScore = world.score;
      const foes = world.foes.filter((f) => f.alive);
      const target = foes[0];
      stage.burst(target ? target.pos.x : 0, target ? target.pos.y : 0, target ? target.pos.z : 0, false);
      stage.punch();
      audio.play('hit');
    }
    if (world.lives < lastLives) {
      lastLives = world.lives;
      stage.hurtShake();
    }
    if (world.outcome !== 'running') endRun(world.outcome === 'won');
  }

  stage.sync(world, dt);
  stage.render(dt);

  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    hud.setFps(frames / fpsTime);
    frames = 0;
    fpsTime = 0;
  }
  if (!ended) {
    hud.setScore(world.score);
    hud.setLives(world.lives);
    hud.setTime((world.runFramesMax - world.runFrames) / 60);
  }
}

requestAnimationFrame(frame);
