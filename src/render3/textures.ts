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
