export interface Building {
  x: number;
  z: number;
  /** Horizontal collision radius. */
  r: number;
  /** Roof height: flight above h + 1 clears the block. */
  h: number;
  w: number;
  d: number;
  rot: number;
  colorIdx: number;
}

function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded city layout shared by sim colliders and render meshes, so what you
 * see is what you collide with. Same seed → same city, every device.
 */
export function buildArenaLayout(seed: number, count = 26): Building[] {
  const rand = mulberry(seed);
  const palette = 4;
  const out: Building[] = [];
  for (let i = 0; i < count; i++) {
    const w = 6 + rand() * 10;
    const h = 8 + rand() * 26;
    const d = 6 + rand() * 10;
    const angle = rand() * Math.PI * 2;
    const radius = 45 + rand() * 65;
    out.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      r: Math.max(w, d) / 2 + 1.5,
      h,
      w,
      d,
      rot: rand() * Math.PI,
      colorIdx: i % palette
    });
  }
  return out;
}
