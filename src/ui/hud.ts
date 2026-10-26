import type { ChapterDef, LocalizedText } from '../content3/types';
import type { RuntimeResult, SelectCard } from '../story/runtime';
import { formatTime, getLang, localized, t } from '../core/i18n';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  parent: HTMLElement
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  parent.append(node);
  return node;
}

function button(
  parent: HTMLElement,
  label: string,
  action: () => void,
  opts: { primary?: boolean; disabled?: boolean; className?: string } = {}
): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `hud-btn ${opts.primary ? 'hud-btn-primary' : ''} ${opts.className ?? ''}`.trim();
  node.textContent = label;
  node.disabled = opts.disabled === true;
  if (opts.disabled) node.setAttribute('aria-disabled', 'true');
  node.addEventListener('click', action);
  parent.append(node);
  return node;
}

export interface Hud {
  showTitle(opts: {
    hasContinue: boolean;
    amulet: boolean;
    onStart: () => void;
    onContinue: () => void;
    onChapters: () => void;
    onLang: () => void;
    onMute: () => void;
  }): void;
  showSelect(opts: {
    cards: SelectCard[];
    amulet: boolean;
    onPick: (id: string) => void;
    onBack: () => void;
    onLang: () => void;
    onMute: () => void;
  }): void;
  showBriefing(opts: {
    chapter: ChapterDef;
    onFly: () => void;
    onBack: () => void;
    onLang: () => void;
    onMute: () => void;
  }): void;
  showPlaying(): void;
  showPause(opts: {
    onResume: () => void;
    onRestart: () => void;
    onChapters: () => void;
    onLang: () => void;
    onMute: () => void;
    shakeOn: boolean;
    onToggleShake: () => void;
    quality: 'high' | 'low';
    onToggleQuality: () => void;
  }): void;
  showDebrief(opts: {
    chapter: ChapterDef;
    result: RuntimeResult;
    nextTitle: string | null;
    nextActionLabel?: string;
    amulet: boolean;
    onNext: () => void;
    onChapters: () => void;
    onLang: () => void;
  }): void;
  showEpilogue(opts: { amulet: boolean; onClose: () => void }): void;
  showCard(card: { title?: LocalizedText; body: LocalizedText }, onDismiss: () => void): void;
  hideCard(): void;
  showFatal(title: string, body: string, retry: string, onRetry: () => void): void;
  setObjective(text: string): void;
  setShards(found: number, total: number): void;
  setLives(lives: number): void;
  setParanoia(value: number): void;
  setFps(value: number): void;
  setBoss(name: string, done: number, total: number): void;
  hideBoss(): void;
  setMuted(muted: boolean): void;
  toast(text: string): void;
  onPause(handler: () => void): void;
  onMute(handler: () => void): void;
  touch: {
    stick: HTMLElement;
    cap: HTMLElement;
    sting: HTMLButtonElement;
    boost: HTMLButtonElement;
    up: HTMLButtonElement;
    down: HTMLButtonElement;
    perch: HTMLButtonElement;
  };
}

/** DOM HUD + screens. The WebGL canvas never carries text. */
export function createHud(): Hud {
  const host = document.getElementById('ui') ?? document.body;
  host.classList.add('hud-root');

  const bar = el('div', 'hud-bar', host);
  bar.hidden = true;
  const objective = el('span', 'hud-objective', bar);
  const shards = el('span', 'hud-chip', bar);
  const lives = el('span', 'hud-chip', bar);
  const paranoia = el('span', 'hud-paranoia', bar);
  const paranoiaFill = el('i', 'hud-paranoia-fill', paranoia);
  const fps = el('span', 'hud-chip hud-fps', bar);
  const actions = el('div', 'hud-actions', bar);
  const muteButton = el('button', 'hud-icon-button', actions);
  muteButton.type = 'button';
  const pauseButton = el('button', 'hud-icon-button', actions);
  pauseButton.type = 'button';
  pauseButton.textContent = t('pause');

  const bossBar = el('div', 'hud-boss', host);
  bossBar.hidden = true;
  bossBar.setAttribute('role', 'status');
  const bossName = el('span', 'hud-boss-name', bossBar);
  const bossTrack = el('div', 'hud-boss-track', bossBar);
  const bossFill = el('i', 'hud-boss-fill', bossTrack);

  const screen = el('div', 'hud-screen', host);
  screen.hidden = true;
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.tabIndex = -1;

  const card = el('div', 'hud-card', host);
  card.hidden = true;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  const cardTitle = el('h2', 'hud-card-title', card);
  const cardBody = el('p', 'hud-card-body', card);
  const cardActions = el('div', 'hud-card-actions', card);
  const cardHint = el('span', 'hud-card-hint', cardActions);

  const toastNode = el('div', 'hud-toast', host);
  toastNode.hidden = true;
  let toastTimer: number | undefined;

  const touch = el('div', 'hud-touch', host);
  const stick = el('div', 'hud-stick', touch);
  const cap = el('div', 'hud-cap', stick);
  const sting = el('button', 'hud-touch-button hud-touch-sting', touch);
  sting.type = 'button';
  sting.textContent = t('sting');
  const boost = el('button', 'hud-touch-button hud-touch-boost', touch);
  boost.type = 'button';
  boost.textContent = t('boost');
  const up = el('button', 'hud-touch-button hud-touch-up', touch);
  up.type = 'button';
  up.textContent = t('up');
  const down = el('button', 'hud-touch-button hud-touch-down', touch);
  down.type = 'button';
  down.textContent = t('down');
  const perch = el('button', 'hud-touch-button hud-touch-perch', touch);
  perch.type = 'button';
  perch.textContent = t('perch');
  const isTouch =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
      ? true
      : (navigator.maxTouchPoints ?? 0) > 0;
  touch.style.display = isTouch ? 'block' : 'none';

  const style = document.createElement('style');
  style.textContent = `
    .hud-root{position:fixed;inset:0;pointer-events:none;color:#f3ecdd;
      font-family:system-ui,'Segoe UI',sans-serif;z-index:10}
    .hud-bar{position:absolute;top:0;left:0;right:0;display:flex;gap:.9rem;align-items:center;
      padding:.65rem 1rem;font-family:ui-monospace,SFMono-Regular,monospace;font-size:.92rem;
      text-shadow:0 1px 3px #000;background:linear-gradient(180deg,rgb(6 8 16 / 62%),transparent)}
    .hud-bar[hidden]{display:none}
    .hud-objective{color:#ffd75e;max-width:46ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .hud-chip{color:#f3ecdd;opacity:.88;white-space:nowrap}
    .hud-fps{margin-left:auto;color:#a99bb5}
    .hud-paranoia{width:4.5rem;height:.35rem;border-radius:99px;background:#2a2438;overflow:hidden;opacity:.7}
    .hud-paranoia-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff9a3d,#ff4a3d);
      transition:width .2s linear}
    .hud-actions{display:flex;gap:.5rem;pointer-events:auto}
    .hud-icon-button,.hud-btn{border:1px solid #4a3c5e;border-radius:.55rem;background:#171320;
      color:#f3ecdd;padding:.42rem .85rem;font:inherit;cursor:pointer;pointer-events:auto}
    .hud-icon-button:hover,.hud-btn:hover,.hud-icon-button:focus-visible,.hud-btn:focus-visible{
      border-color:#e8b04b;color:#e8b04b;outline:none}
    .hud-icon-button[aria-pressed="true"]{border-color:#e8b04b;color:#e8b04b}
    .hud-screen{position:absolute;inset:0;display:grid;place-items:center;padding:clamp(1rem,4vw,2.5rem);
      background:radial-gradient(ellipse at 50% 40%,rgb(8 10 20 / 55%),rgb(4 5 10 / 90%));
      pointer-events:auto;overflow:auto}
    .hud-screen[hidden]{display:none}
    .hud-panel{width:min(78rem,calc(100vw - 2rem));display:grid;gap:1rem;text-align:center;justify-items:center}
    .hud-title{font-size:clamp(2.4rem,9vw,5.4rem);line-height:.95;margin:0;color:#e8b04b;
      letter-spacing:.02em;text-shadow:0 4px 24px rgb(232 176 75 / 22%)}
    .hud-tagline{margin:0;color:#f3ecdd;opacity:.86;max-width:46ch;font-size:clamp(1rem,2.4vw,1.25rem)}
    .hud-sub{color:#a99bb5;margin:.2rem 0 0;font-size:.92rem}
    .hud-actions-row{display:flex;gap:.7rem;flex-wrap:wrap;justify-content:center;margin-top:.4rem}
    .hud-btn-primary{border-color:#e8b04b;background:#e8b04b;color:#120f18;font-weight:650}
    .hud-btn-primary:hover,.hud-btn-primary:focus-visible{background:#f3c96a;color:#120f18}
    .hud-btn-ghost{background:transparent;color:#e8b04b}
    .hud-btn:disabled{opacity:.42;cursor:not-allowed;border-color:#3a3048}
    .hud-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem;
      width:100%;max-width:72rem;text-align:left}
    @media (max-width:900px){.hud-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (max-width:560px){.hud-grid{grid-template-columns:1fr}}
    .hud-chapter{border:1px solid #3a3048;border-radius:.8rem;background:rgb(20 16 28 / 88%);
      color:#f3ecdd;padding:.9rem 1rem;display:grid;gap:.28rem;cursor:pointer;text-align:left}
    .hud-chapter:hover,.hud-chapter:focus-visible{border-color:#e8b04b;outline:none;
      box-shadow:0 0 0 1px #e8b04b inset}
    .hud-chapter:disabled{opacity:.45;cursor:not-allowed;border-style:dashed}
    .hud-chapter-num{font-family:ui-monospace,monospace;font-size:.72rem;color:#a99bb5;letter-spacing:.14em}
    .hud-chapter-title{font-size:1.08rem;color:#ffd75e}
    .hud-chapter-sub{font-size:.85rem;color:#c9c0d4}
    .hud-chapter-meta{font-family:ui-monospace,monospace;font-size:.72rem;color:#a99bb5;display:flex;gap:.7rem;flex-wrap:wrap}
    .hud-panel-card{width:min(42rem,calc(100vw - 2rem));background:rgb(16 13 24 / 92%);border:1px solid #3a3048;
      border-radius:1rem;padding:clamp(1.2rem,3vw,2rem);display:grid;gap:.8rem;text-align:left}
    .hud-panel-card h2{margin:0;color:#e8b04b;font-size:clamp(1.6rem,4vw,2.4rem)}
    .hud-panel-card p{margin:0;line-height:1.5;color:#e6dced}
    .hud-kicker{font-family:ui-monospace,monospace;font-size:.72rem;letter-spacing:.2em;color:#a99bb5;
      text-transform:uppercase}
    .hud-list{margin:0;padding-left:1.1rem;display:grid;gap:.35rem;color:#e6dced}
    .hud-list b{color:#ffd75e;font-weight:600}
    .hud-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(7rem,1fr));gap:.6rem;margin:.2rem 0}
    .hud-stat-box{border:1px solid #3a3048;border-radius:.6rem;padding:.6rem;background:#141020}
    .hud-stat-box span{display:block;font-size:.68rem;letter-spacing:.12em;color:#a99bb5;text-transform:uppercase}
    .hud-stat-box strong{font-size:1.15rem;color:#ffd75e}
    .hud-card{position:absolute;left:0;right:0;bottom:0;padding:clamp(1rem,4vw,2.5rem);
      background:linear-gradient(0deg,rgb(4 5 10 / 96%) 30%,rgb(4 5 10 / 0%));
      pointer-events:auto;display:grid;gap:.55rem;justify-items:center;text-align:center}
    .hud-card[hidden]{display:none}
    .hud-card-title{margin:0;color:#e8b04b;font-size:clamp(1.2rem,3vw,1.7rem)}
    .hud-card-body{margin:0;max-width:64ch;line-height:1.55;font-size:clamp(.98rem,2.2vw,1.12rem)}
    .hud-card-actions{display:flex;align-items:center;gap:.8rem;margin-top:.2rem}
    .hud-card-hint{font-size:.78rem;color:#a99bb5;font-family:ui-monospace,monospace}
    .hud-toast{position:absolute;left:50%;bottom:12%;transform:translateX(-50%);
      background:rgb(16 13 24 / 92%);border:1px solid #e8b04b;border-radius:999px;
      padding:.5rem 1rem;color:#ffd75e;font-size:.9rem;pointer-events:none;max-width:80vw;text-align:center}
    .hud-toast[hidden]{display:none}
    .hud-boss{position:absolute;top:3.1rem;left:50%;transform:translateX(-50%);
      width:min(22rem,72vw);display:grid;gap:.3rem;justify-items:center;pointer-events:none;
      text-shadow:0 1px 3px #000}
    .hud-boss[hidden]{display:none}
    .hud-boss-name{font-family:ui-monospace,monospace;font-size:.78rem;letter-spacing:.16em;
      text-transform:uppercase;color:#ffb060}
    .hud-boss-track{width:100%;height:.4rem;border-radius:99px;background:#2a1a1a;
      border:1px solid #5a2a1a;overflow:hidden}
    .hud-boss-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff7a3d,#ffd75e);
      transition:width .2s linear}
    .hud-amulet{color:#ffd75e;margin:0;font-size:.9rem;letter-spacing:.02em;
      text-shadow:0 0 12px rgb(255 215 94 / 30%)}
    .hud-fatal{color:#f3ecdd;max-width:44rem}
    .hud-fatal h2{color:#e8b04b}
    .hud-touch{position:absolute;inset:0;pointer-events:none}
    .hud-stick{position:fixed;left:0;top:0;width:110px;height:110px;border:1px solid rgb(232 176 75 / 55%);
      border-radius:50%;background:rgb(20 16 28 / 30%);transform:translate(-50%,-50%);opacity:0;
      transition:opacity .12s;pointer-events:none}
    .hud-stick.is-active{opacity:1}
    .hud-cap{position:absolute;left:50%;top:50%;width:44px;height:44px;border-radius:50%;
      background:rgb(232 176 75 / 58%);border:1px solid #ffd75e;transform:translate(-50%,-50%);
      pointer-events:none}
    .hud-touch-button{position:fixed;bottom:1.4rem;width:68px;height:68px;border-radius:50%;
      border:1px solid #e8b04b;background:rgb(23 19 32 / 76%);color:#ffd75e;font:inherit;
      font-size:.78rem;pointer-events:auto;touch-action:none;user-select:none;z-index:2}
    .hud-touch-sting{right:1.4rem}
    .hud-touch-boost{right:6.2rem;bottom:2.2rem;width:56px;height:56px;opacity:.88}
    .hud-touch-up{right:1.4rem;bottom:6.4rem;width:56px;height:56px;opacity:.9}
    .hud-touch-down{right:1.4rem;bottom:9.8rem;width:56px;height:56px;opacity:.9}
    .hud-touch-perch{right:6.2rem;bottom:6.2rem;width:60px;height:60px;opacity:.92;
      border-color:#8ad8ff;color:#bfe8ff}
    @media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}
  `;
  document.head.append(style);

  let currentMuted = false;
  let pauseHandler: () => void = () => undefined;
  let muteHandler: () => void = () => undefined;
  let cardHandler: (() => void) | null = null;

  const setBar = (visible: boolean) => {
    bar.hidden = !visible;
  };
  const hideBossBar = () => {
    bossBar.hidden = true;
  };

  const clearScreen = () => {
    screen.replaceChildren();
    screen.hidden = true;
  };

  const openScreen = (): HTMLElement => {
    screen.replaceChildren();
    screen.hidden = false;
    screen.scrollTop = 0;
    return screen;
  };

  const addHeader = (parent: HTMLElement, kicker: string, title: string, subtitle?: string) => {
    const wrap = el('div', 'hud-panel', parent);
    if (kicker) el('div', 'hud-kicker', wrap).textContent = kicker;
    const heading = el('h1', 'hud-title', wrap);
    heading.textContent = title;
    if (subtitle) el('p', 'hud-tagline', wrap).textContent = subtitle;
    return wrap;
  };

  const focusFirst = () => {
    const first = screen.querySelector<HTMLButtonElement>('button:not(:disabled)');
    first?.focus();
  };

  muteButton.addEventListener('click', () => muteHandler());
  pauseButton.addEventListener('click', () => pauseHandler());

  return {
    showTitle: ({ hasContinue, amulet, onStart, onContinue, onChapters, onLang, onMute }) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const wrap = addHeader(parent, 'Egara 3D', t('title'), t('tagline'));
      el('p', 'hud-sub', wrap).textContent = isTouch ? t('touchHint') : t('controls');
      if (amulet) el('p', 'hud-amulet', wrap).textContent = `✦ ${t('amuletEarned')}`;
      const row = el('div', 'hud-actions-row', wrap);
      button(row, t('start'), onStart, { primary: true });
      if (hasContinue) button(row, t('continue'), onContinue);
      button(row, t('chapters'), onChapters);
      const secondary = el('div', 'hud-actions-row', wrap);
      button(secondary, `${t('language')}: ${getLang() === 'en' ? t('english') : t('telugu')}`, onLang, {
        className: 'hud-btn-ghost'
      });
      button(secondary, currentMuted ? t('unmute') : t('mute'), onMute, { className: 'hud-btn-ghost' });
      focusFirst();
    },

    showSelect: ({ cards, amulet, onPick, onBack, onLang, onMute }) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const wrap = el('div', 'hud-panel', parent);
      el('div', 'hud-kicker', wrap).textContent = t('chapterSelect');
      if (amulet) el('p', 'hud-amulet', wrap).textContent = `✦ ${t('amuletEarned')}`;
      const grid = el('div', 'hud-grid', wrap);
      for (const card of cards) {
        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'hud-chapter';
        node.disabled = card.locked;
        if (card.locked) node.setAttribute('aria-disabled', 'true');
        node.addEventListener('click', () => onPick(card.id));
        const num = el('span', 'hud-chapter-num', node);
        num.textContent = `${t('chapter')} ${card.order}`;
        const title = el('span', 'hud-chapter-title', node);
        title.textContent = localized(card.title);
        const sub = el('span', 'hud-chapter-sub', node);
        sub.textContent = localized(card.subtitle);
        const meta = el('span', 'hud-chapter-meta', node);
        meta.textContent = card.locked
          ? t('locked')
          : card.total > 0
            ? `${t('shards')} ${card.shards}/${card.total}${card.done ? ` · ${t('bestTime')} ${formatTime(card.bestTime)}` : ''}`
            : card.done
              ? `${t('completed')} · ${t('bestTime')} ${formatTime(card.bestTime)}`
              : '';
        grid.append(node);
      }
      const row = el('div', 'hud-actions-row', wrap);
      button(row, t('backToChapters'), onBack, { className: 'hud-btn-ghost' });
      button(row, `${t('language')}: ${getLang() === 'en' ? t('english') : t('telugu')}`, onLang, {
        className: 'hud-btn-ghost'
      });
      button(row, currentMuted ? t('unmute') : t('mute'), onMute, { className: 'hud-btn-ghost' });
      focusFirst();
    },

    showBriefing: ({ chapter, onFly, onBack, onLang, onMute }) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const panel = el('div', 'hud-panel-card', parent);
      el('div', 'hud-kicker', panel).textContent = `${t('chapter')} ${chapter.order} · ${t('briefing')}`;
      const heading = el('h2', '', panel);
      heading.textContent = localized(chapter.title);
      const sub = el('p', '', panel);
      sub.textContent = localized(chapter.subtitle);
      const intro = chapter.cards.find((candidate) => candidate.at === 'intro');
      if (intro) {
        const body = el('p', '', panel);
        body.textContent = localized(intro.body);
      }
      const list = el('ul', 'hud-list', panel);
      for (const obj of chapter.objectives) {
        const item = document.createElement('li');
        const label = document.createElement('b');
        label.textContent = localized(obj.label);
        item.append(label);
        if (obj.hint) {
          const hint = document.createElement('span');
          hint.textContent = ` — ${localized(obj.hint)}`;
          item.append(hint);
        }
        list.append(item);
      }
      const row = el('div', 'hud-actions-row', panel);
      button(row, t('fly'), onFly, { primary: true });
      button(row, t('backToChapters'), onBack, { className: 'hud-btn-ghost' });
      button(row, `${t('language')}: ${getLang() === 'en' ? t('english') : t('telugu')}`, onLang, {
        className: 'hud-btn-ghost'
      });
      button(row, currentMuted ? t('unmute') : t('mute'), onMute, { className: 'hud-btn-ghost' });
      focusFirst();
    },

    showPlaying: () => {
      clearScreen();
      pauseButton.textContent = t('pause');
      hideBossBar();
      setBar(true);
    },

    showPause: ({
      onResume,
      onRestart,
      onChapters,
      onLang,
      onMute,
      shakeOn,
      onToggleShake,
      quality,
      onToggleQuality
    }) => {
      pauseButton.textContent = t('pause');
      hideBossBar();
      setBar(true);
      const parent = openScreen();
      const panel = el('div', 'hud-panel-card', parent);
      const heading = el('h2', '', panel);
      heading.textContent = t('paused');
      const row = el('div', 'hud-actions-row', panel);
      button(row, t('resume'), onResume, { primary: true });
      button(row, t('restart'), onRestart);
      button(row, t('backToChapters'), onChapters);
      const settings = el('div', 'hud-actions-row', panel);
      button(
        settings,
        `${t('graphics')}: ${quality === 'high' ? t('high') : t('low')}`,
        onToggleQuality,
        { className: 'hud-btn-ghost' }
      );
      button(settings, `${t('shake')}: ${shakeOn ? t('on') : t('off')}`, onToggleShake, {
        className: 'hud-btn-ghost'
      });
      button(settings, `${t('language')}: ${getLang() === 'en' ? t('english') : t('telugu')}`, onLang, {
        className: 'hud-btn-ghost'
      });
      button(settings, currentMuted ? t('unmute') : t('mute'), onMute, { className: 'hud-btn-ghost' });
      focusFirst();
    },

    showDebrief: ({ chapter, result, nextTitle, nextActionLabel, amulet, onNext, onChapters, onLang }) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const panel = el('div', 'hud-panel-card', parent);
      el('div', 'hud-kicker', panel).textContent = t('chapterComplete');
      const heading = el('h2', '', panel);
      heading.textContent = localized(chapter.title);
      const stats = el('div', 'hud-stats', panel);
      const stat = (label: string, value: string) => {
        const box = el('div', 'hud-stat-box', stats);
        el('span', '', box).textContent = label;
        el('strong', '', box).textContent = value;
      };
      stat(t('time'), formatTime(result.time));
      stat(t('shards'), `${result.shards}/${result.total}`);
      stat(t('falls'), String(result.deaths));
      if (amulet) el('p', 'hud-amulet', panel).textContent = `✦ ${t('amuletEarned')}`;
      if (nextTitle) {
        const next = el('p', '', panel);
        next.textContent = `${t('nextChapter')}: ${nextTitle}`;
      }
      const row = el('div', 'hud-actions-row', panel);
      if (nextTitle) button(row, nextActionLabel ?? t('nextChapter'), onNext, { primary: true });
      button(row, t('backToChapters'), onChapters);
      button(row, `${t('language')}: ${getLang() === 'en' ? t('english') : t('telugu')}`, onLang, {
        className: 'hud-btn-ghost'
      });
      focusFirst();
    },

    showEpilogue: ({ amulet, onClose }) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const panel = el('div', 'hud-panel-card', parent);
      el('div', 'hud-kicker', panel).textContent = t('storySoFar');
      const heading = el('h2', '', panel);
      heading.textContent = t('epilogue');
      const body = el('p', '', panel);
      body.textContent = t('epilogueBody');
      const charm = el('p', amulet ? 'hud-amulet' : 'hud-sub', panel);
      charm.textContent = amulet ? `✦ ${t('amuletEarned')}` : t('amuletMissing');
      const row = el('div', 'hud-actions-row', panel);
      button(row, t('newTale'), onClose, { primary: true });
      focusFirst();
    },

    showCard: (content, onDismiss) => {
      cardTitle.textContent = content.title ? localized(content.title) : t('storySoFar');
      cardTitle.hidden = !content.title;
      cardBody.textContent = localized(content.body);
      cardActions.replaceChildren();
      cardHint.textContent = t('press');
      cardHandler = onDismiss;
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'hud-btn hud-btn-primary';
      next.textContent = t('continue');
      next.addEventListener('click', () => {
        const handler = cardHandler;
        cardHandler = null;
        handler?.();
      });
      cardActions.append(next, cardHint);
      card.hidden = false;
      next.focus();
    },

    hideCard: () => {
      card.hidden = true;
      cardHandler = null;
    },

    showFatal: (title, body, retry, onRetry) => {
      setBar(false);
      hideBossBar();
      const parent = openScreen();
      const panel = el('div', 'hud-panel-card hud-fatal', parent);
      const heading = el('h2', '', panel);
      heading.textContent = title;
      const copy = el('p', '', panel);
      copy.textContent = body;
      const row = el('div', 'hud-actions-row', panel);
      button(row, retry, onRetry, { primary: true });
      focusFirst();
    },

    setObjective: (text) => {
      objective.textContent = `${t('objective')}: ${text}`;
    },
    setShards: (found, total) => {
      shards.textContent = `${t('shards')} ${found}/${total}`;
    },
    setLives: (count) => {
      lives.textContent = `${'♥'.repeat(Math.max(0, count)) || '—'}`;
    },
    setParanoia: (value) => {
      paranoiaFill.style.width = `${Math.max(0, Math.min(100, value))}%`;
      paranoia.style.opacity = value > 2 ? '0.85' : '0.25';
    },
    setFps: (value) => {
      fps.textContent = `${Math.round(value)} fps`;
    },
    setBoss: (name, done, total) => {
      if (total <= 0) {
        bossBar.hidden = true;
        return;
      }
      bossBar.hidden = false;
      bossName.textContent = `${name} ${done}/${total}`;
      bossBar.setAttribute('aria-label', `${name} ${done}/${total}`);
      bossFill.style.width = `${Math.round((done / total) * 100)}%`;
    },
    hideBoss: hideBossBar,
    setMuted: (muted) => {
      currentMuted = muted;
      muteButton.textContent = muted ? t('unmute') : t('mute');
      muteButton.setAttribute('aria-pressed', String(muted));
      sting.textContent = t('sting');
      boost.textContent = t('boost');
      up.textContent = t('up');
      down.textContent = t('down');
      perch.textContent = t('perch');
    },
    toast: (text) => {
      toastNode.textContent = text;
      toastNode.hidden = false;
      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toastNode.hidden = true;
      }, 2200);
    },
    onPause: (handler) => {
      pauseHandler = handler;
    },
    onMute: (handler) => {
      muteHandler = handler;
    },
    touch: { stick, cap, sting, boost, up, down, perch }
  };
}
