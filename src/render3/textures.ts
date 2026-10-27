import * as THREE from 'three';

export type TextureKind =
  | 'concrete'
  | 'asphalt'
  | 'wood'
  | 'marble'
  | 'paper'
  | 'fabric'
  | 'metal'
  | 'window';

const cache = new Map<string, THREE.CanvasTexture>();

function rand(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise(ctx: CanvasRenderingContext2D, size: number, random: () => number, count: number, min: number, max: number): void {
  for (let i = 0; i < count; i++) {
    const shade = Math.floor(min + random() * (max - min));
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.globalAlpha = 0.18 + random() * 0.3;
    const s = 1 + random() * 2.2;
    ctx.fillRect(random() * size, random() * size, s, s);
  }
  ctx.globalAlpha = 1;
}

function draw(kind: TextureKind, ctx: CanvasRenderingContext2D, size: number): void {
  const random = rand(kind.length * 997 + size);
  const base: Record<TextureKind, string> = {
    concrete: '#8c8c8c',
    asphalt: '#34363c',
    wood: '#7a5230',
    marble: '#c8c0b4',
    paper: '#e0d0ac',
    fabric: '#7a3030',
    metal: '#9aa4b4',
    window: '#1a1e28'
  };
  ctx.fillStyle = base[kind];
  ctx.fillRect(0, 0, size, size);

  if (kind === 'concrete') {
    noise(ctx, size, random, 1800, 90, 190);
    ctx.strokeStyle = 'rgba(40,40,40,0.28)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      let x = random() * size;
      let y = random() * size;
      ctx.moveTo(x, y);
      for (let p = 0; p < 4; p++) {
        x += (random() - 0.5) * 30;
        y += random() * 24;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (kind === 'asphalt') {
    noise(ctx, size, random, 2600, 20, 110);
    ctx.fillStyle = 'rgba(160,160,160,0.16)';
    for (let i = 0; i < 140; i++) {
      ctx.fillRect(random() * size, random() * size, 1.5, 1.5);
    }
  } else if (kind === 'wood') {
    for (let y = 0; y < size; y += 4) {
      const shade = 60 + Math.floor(random() * 40);
      ctx.strokeStyle = `rgba(${shade + 30},${shade},${shade - 20},0.35)`;
      ctx.beginPath();
      ctx.moveTo(0, y + random() * 3);
      ctx.bezierCurveTo(size * 0.3, y + random() * 6, size * 0.7, y - random() * 6, size, y + random() * 3);
      ctx.stroke();
    }
    noise(ctx, size, random, 500, 60, 120);
  } else if (kind === 'marble') {
    noise(ctx, size, random, 500, 150, 220);
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = `rgba(80,80,90,${0.12 + random() * 0.18})`;
      ctx.lineWidth = 0.7 + random() * 1.4;
      ctx.beginPath();
      let x = random() * size;
      let y = random() * size;
      ctx.moveTo(x, y);
      for (let p = 0; p < 5; p++) {
        x += (random() - 0.5) * 50;
        y += (random() - 0.5) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  } else if (kind === 'paper') {
    noise(ctx, size, random, 900, 170, 235);
    ctx.strokeStyle = 'rgba(140,120,90,0.18)';
    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      const x = random() * size;
      const y = random() * size;
      ctx.moveTo(x, y);
      ctx.lineTo(x + random() * 7 - 3.5, y + random() * 7 - 3.5);
      ctx.stroke();
    }
  } else if (kind === 'fabric') {
    for (let y = 0; y < size; y += 3) {
      ctx.fillStyle = `rgba(255,255,255,${0.03 + random() * 0.03})`;
      ctx.fillRect(0, y, size, 1);
    }
    for (let x = 0; x < size; x += 3) {
      ctx.fillStyle = `rgba(0,0,0,${0.05 + random() * 0.04})`;
      ctx.fillRect(x, 0, 1, size);
    }
    noise(ctx, size, random, 400, 60, 120);
  } else if (kind === 'metal') {
    for (let y = 0; y < size; y += 2) {
      const shade = 120 + Math.floor(random() * 60);
      ctx.strokeStyle = `rgba(${shade},${shade + 6},${shade + 14},0.22)`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    noise(ctx, size, random, 300, 100, 190);
  } else {
    const cols = 2;
    const rows = 3;
    const cw = size / cols;
    const ch = size / rows;
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const lit = random() > 0.45;
        const warmth = 180 + Math.floor(random() * 60);
        ctx.fillStyle = lit
          ? `rgb(${warmth},${Math.floor(warmth * 0.78)},${Math.floor(warmth * 0.45)})`
          : `rgb(${28 + Math.floor(random() * 18)},${32 + Math.floor(random() * 18)},${44 + Math.floor(random() * 20)})`;
        ctx.fillRect(col * cw + 3, row * ch + 4, cw - 6, ch - 8);
      }
    }
    ctx.strokeStyle = '#05060a';
    ctx.lineWidth = 4;
    for (let col = 1; col < cols; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cw, 0);
      ctx.lineTo(col * cw, size);
      ctx.stroke();
    }
    for (let row = 1; row < rows; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * ch);
      ctx.lineTo(size, row * ch);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}

const facades = new Map<string, THREE.CanvasTexture>();
const shopfronts = new Map<string, THREE.CanvasTexture>();

/** Lived-in apartment facade: floors, balconies, grilles, ACs, cables, grime. */
export function facadeTexture(base: string): THREE.CanvasTexture {
  const cached = facades.get(base);
  if (cached) return cached;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for facade');
  const random = rand(base.length * 733 + 19);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const floors = 4;
  const bays = 4;
  const floorH = size / floors;
  const bayW = size / bays;

  for (let floor = 0; floor < floors; floor++) {
    const y = floor * floorH;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, y + floorH - 5, size, 5);
    for (let bay = 0; bay < bays; bay++) {
      const x = bay * bayW;
      const lit = random() > 0.42;
      const warmth = 180 + Math.floor(random() * 55);
      ctx.fillStyle = lit
        ? `rgba(${warmth},${Math.floor(warmth * 0.72)},${Math.floor(warmth * 0.42)},0.92)`
        : 'rgba(14,18,26,0.92)';
      ctx.fillRect(x + 12, y + 26, bayW - 24, floorH - 55);

      ctx.strokeStyle = 'rgba(8,10,14,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 12, y + 26, bayW - 24, floorH - 55);
      for (let grille = 1; grille < 4; grille++) {
        const gx = x + 12 + ((bayW - 24) * grille) / 4;
        ctx.beginPath();
        ctx.moveTo(gx, y + 26);
        ctx.lineTo(gx, y + floorH - 29);
        ctx.stroke();
      }
      for (let bar = 1; bar < 3; bar++) {
        const gy = y + 26 + ((floorH - 55) * bar) / 3;
        ctx.beginPath();
        ctx.moveTo(x + 12, gy);
        ctx.lineTo(x + bayW - 12, gy);
        ctx.stroke();
      }

      if (random() > 0.55) {
        ctx.fillStyle = 'rgba(150,158,170,0.85)';
        ctx.fillRect(x + bayW - 42, y + floorH - 30, 24, 16);
        ctx.fillStyle = 'rgba(30,34,40,0.9)';
        ctx.beginPath();
        ctx.arc(x + bayW - 30, y + floorH - 22, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (floor > 0 && random() > 0.35) {
        ctx.fillStyle = 'rgba(48,44,40,0.9)';
        ctx.fillRect(x + 3, y + 5, bayW - 6, 14);
        ctx.strokeStyle = 'rgba(180,180,170,0.35)';
        ctx.lineWidth = 1;
        for (let rail = 1; rail < 6; rail++) {
          const rx = x + 3 + ((bayW - 6) * rail) / 6;
          ctx.beginPath();
          ctx.moveTo(rx, y + 5);
          ctx.lineTo(rx, y + 19);
          ctx.stroke();
        }
      }
    }
    if (random() > 0.5) {
      ctx.strokeStyle = 'rgba(8,8,10,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + floorH * 0.4);
      ctx.bezierCurveTo(size * 0.3, y + floorH * 0.45, size * 0.6, y + floorH * 0.35, size, y + floorH * 0.5);
      ctx.stroke();
    }
  }

  const grime = ctx.createLinearGradient(0, 0, 0, size);
  grime.addColorStop(0, 'rgba(0,0,0,0.05)');
  grime.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  facades.set(base, tex);
  return tex;
}

/** Five lit shop bays in one texture; cheap street-depth plane. */
export function shopfrontTexture(): THREE.CanvasTexture {
  const cached = shopfronts.get('main');
  if (cached) return cached;
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for shopfront');
  const random = rand(4417);

  ctx.fillStyle = '#171a22';
  ctx.fillRect(0, 0, width, height);

  const names = ['TEA', 'TAILOR', 'REPAIRS', 'SWEETS', 'FLOWERS'];
  const awning = ['#8a2a2a', '#1a5a4a', '#2a3a6a', '#7a5a1a', '#5a2a6a'];
  for (let i = 0; i < 5; i++) {
    const x = i * (width / 5);
    const w = width / 5;
    const lit = random() > 0.15;
    ctx.fillStyle = lit ? 'rgba(255,190,110,0.16)' : 'rgba(10,12,18,0.9)';
    ctx.fillRect(x + 8, 140, w - 16, height - 160);

    ctx.fillStyle = awning[i];
    ctx.fillRect(x + 2, 108, w - 4, 44);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let stripe = 0; stripe < 7; stripe++) {
      ctx.fillRect(x + 6 + stripe * (w / 7), 108, 8, 44);
    }

    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(x + 18, 160, w - 36, 28);
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 24px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(names[i], x + w / 2, 175);

    ctx.fillStyle = 'rgba(20,24,32,0.95)';
    ctx.fillRect(x + 38, 206, w - 76, 190);
    ctx.strokeStyle = 'rgba(160,170,180,0.25)';
    ctx.lineWidth = 2;
    for (let slat = 0; slat < 8; slat++) {
      ctx.beginPath();
      ctx.moveTo(x + 38, 212 + slat * 22);
      ctx.lineTo(x + w - 38, 212 + slat * 22);
      ctx.stroke();
    }
    if (i === 0 || i === 3) {
      ctx.fillStyle = 'rgba(255,190,110,0.5)';
      ctx.fillRect(x + 54, 232, w - 108, 40);
      ctx.fillStyle = 'rgba(30,24,18,0.9)';
      ctx.fillRect(x + 70, 246, w - 140, 12);
    }
    ctx.fillStyle = 'rgba(255,214,140,0.7)';
    ctx.beginPath();
    ctx.arc(x + w / 2, 96, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const grime = ctx.createLinearGradient(0, 0, 0, height);
  grime.addColorStop(0.5, 'rgba(0,0,0,0.02)');
  grime.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 0, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  shopfronts.set('main', tex);
  return tex;
}

const sketches = new Map<string, THREE.CanvasTexture>();

/** Pinned pencil study: locket, needle, or wing. */
export function sketchTexture(kind: 'locket' | 'needle' | 'wing'): THREE.CanvasTexture {
  const cached = sketches.get(kind);
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for sketch');
  ctx.fillStyle = '#d8c8a8';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'locket') {
    ctx.arc(105, 100, 38, 0, Math.PI * 2);
    ctx.arc(151, 100, 38, 0, Math.PI * 2);
    ctx.moveTo(67, 122);
    ctx.lineTo(128, 205);
    ctx.lineTo(189, 122);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(128, 70, 12, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'needle') {
    ctx.moveTo(45, 170);
    ctx.lineTo(205, 85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(50, 168, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(45, 170);
    ctx.lineTo(205, 85);
    ctx.stroke();
  } else {
    ctx.moveTo(128, 170);
    ctx.bezierCurveTo(40, 120, 50, 40, 128, 78);
    ctx.bezierCurveTo(206, 40, 216, 120, 128, 170);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(128, 150);
      ctx.lineTo(80 + i * 30, 70 + i * 8);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(60,48,40,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 17, 20);
    ctx.lineTo(10 + i * 17, 236);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  sketches.set(kind, tex);
  return tex;
}

const labels = new Map<string, THREE.CanvasTexture>();

/** Original in-world sign, rendered at runtime. */
export function labelTexture(
  text: string,
  fg = '#ffd75e',
  bg = '#141020',
  width = 512,
  height = 128
): THREE.CanvasTexture {
  const key = `${text}:${fg}:${bg}:${width}:${height}`;
  const cached = labels.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for labels');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.floor(height * 0.44)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  labels.set(key, tex);
  return tex;
}

/** Cached runtime canvas texture. No downloads. */
export function texture(
  kind: TextureKind,
  repeatX = 1,
  repeatY = 1,
  size = 256
): THREE.CanvasTexture {
  const key = `${kind}:${repeatX}:${repeatY}:${size}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for textures');
  draw(kind, ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}
