function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent: HTMLElement): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  parent.append(node);
  return node;
}

export interface Hud {
  setScore(value: number): void;
  setLives(value: number): void;
  setTime(seconds: number): void;
  setFps(value: number): void;
  setMuted(muted: boolean): void;
  showMenu(title: string, body: string, buttons: { label: string; action: () => void }[]): void;
  hideMenu(): void;
  onPause(handler: () => void): void;
  onMute(handler: () => void): void;
}

/** DOM HUD + menus. The WebGL canvas never carries text. */
export function createHud(): Hud {
  const host = document.getElementById('ui') ?? document.body;

  const bar = el('div', 'hud-bar', host);
  const score = el('span', 'hud-stat', bar);
  const lives = el('span', 'hud-stat', bar);
  const time = el('span', 'hud-stat', bar);
  const fps = el('span', 'hud-stat hud-fps', bar);
  const actions = el('div', 'hud-actions', bar);
  const muteButton = el('button', 'hud-button', actions);
  muteButton.type = 'button';
  muteButton.textContent = 'Mute';
  const pauseButton = el('button', 'hud-button', actions);
  pauseButton.type = 'button';
  pauseButton.textContent = 'Pause';

  const menu = el('div', 'hud-menu', host);
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  const menuTitle = el('h2', 'hud-menu-title', menu);
  const menuBody = el('p', 'hud-menu-body', menu);
  const menuActions = el('div', 'hud-menu-actions', menu);

  const style = document.createElement('style');
  style.textContent = `
    .hud-bar{position:absolute;top:0;left:0;right:0;display:flex;gap:1.1rem;align-items:center;
      padding:.7rem 1rem;font-family:ui-monospace,monospace;font-size:.95rem;
      text-shadow:0 1px 2px #000;pointer-events:none}
    .hud-stat{color:#f3ecdd}
    .hud-fps{margin-left:auto;color:#a99bb5}
    .hud-actions{display:flex;gap:.5rem;pointer-events:auto}
    .hud-button{border:1px solid #4a3c5e;border-radius:.5rem;background:#171320;color:#f3ecdd;
      padding:.4rem .85rem;font:inherit;cursor:pointer}
    .hud-button:hover,.hud-button:focus-visible{border-color:#e8b04b;color:#e8b04b}
    .hud-menu{position:absolute;inset:0;display:grid;place-content:center;gap:.75rem;
      text-align:center;background:rgb(6 8 16 / 80%)}
    .hud-menu[hidden]{display:none}
    .hud-menu-title{margin:0;font-size:clamp(1.8rem,6vw,3rem);color:#e8b04b}
    .hud-menu-body{margin:0;color:#f3ecdd;max-width:52ch}
    .hud-menu-actions{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;pointer-events:auto}
    .hud-primary{border:1px solid #e8b04b;border-radius:.5rem;background:#e8b04b;color:#120f18;
      padding:.5rem 1.1rem;font:inherit;cursor:pointer}
    .hud-ghost{background:transparent;color:#e8b04b}
    .hud-primary:focus-visible{outline:3px solid #f3ecdd;outline-offset:2px}
  `;
  document.head.append(style);

  return {
    setScore: (value) => {
      score.textContent = `Score ${value}`;
    },
    setLives: (value) => {
      lives.textContent = `Lives ${'♥'.repeat(Math.max(0, value)) || '—'}`;
    },
    setTime: (seconds) => {
      const safe = Math.max(0, Math.ceil(seconds));
      time.textContent = `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
    },
    setFps: (value) => {
      fps.textContent = `${Math.round(value)} fps`;
    },
    setMuted: (muted) => {
      muteButton.textContent = muted ? 'Unmute' : 'Mute';
      muteButton.setAttribute('aria-pressed', String(muted));
    },
    showMenu: (title, body, buttons) => {
      menuTitle.textContent = title;
      menuBody.textContent = body;
      menuBody.hidden = body.length === 0;
      menuActions.replaceChildren();
      buttons.forEach((button, index) => {
        const node = el('button', index === 0 ? 'hud-primary' : 'hud-primary hud-ghost', menuActions);
        node.type = 'button';
        node.textContent = button.label;
        node.addEventListener('click', button.action);
      });
      menu.hidden = false;
      menuActions.querySelector('button')?.focus();
    },
    hideMenu: () => {
      menu.hidden = true;
      pauseButton.focus();
    },
    onPause: (handler) => {
      pauseButton.onclick = handler;
    },
    onMute: (handler) => {
      muteButton.onclick = handler;
    }
  };
}
