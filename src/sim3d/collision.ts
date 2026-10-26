export interface Box2D {
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  h?: number;
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface CircleBoxHit {
  hit: boolean;
  x: number;
  z: number;
  nx: number;
  nz: number;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Resolve a circle against a rotated box in the XZ plane.
 * Returns the corrected position and the world-space contact normal.
 */
export function resolveCircleBox(
  px: number,
  pz: number,
  radius: number,
  box: Box2D
): CircleBoxHit {
  const c = Math.cos(box.rot);
  const s = Math.sin(box.rot);
  const dx = px - box.x;
  const dz = pz - box.z;
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;

  const halfW = box.w / 2;
  const halfD = box.d / 2;
  const closestX = clamp(lx, -halfW, halfW);
  const closestZ = clamp(lz, -halfD, halfD);
  let diffX = lx - closestX;
  let diffZ = lz - closestZ;
  let distance = Math.hypot(diffX, diffZ);

  if (distance >= radius) {
    return { hit: false, x: px, z: pz, nx: 0, nz: 0 };
  }

  let normalX: number;
  let normalZ: number;
  let penetration: number;

  if (distance > 1e-6) {
    normalX = diffX / distance;
    normalZ = diffZ / distance;
    penetration = radius - distance;
  } else {
    const faceX = halfW - Math.abs(lx);
    const faceZ = halfD - Math.abs(lz);
    if (faceX < faceZ) {
      normalX = lx >= 0 ? 1 : -1;
      normalZ = 0;
      penetration = faceX + radius;
    } else {
      normalX = 0;
      normalZ = lz >= 0 ? 1 : -1;
      penetration = faceZ + radius;
    }
    diffX = normalX;
    diffZ = normalZ;
  }

  const worldX = box.x + lx * c + lz * s;
  const worldZ = box.z - lx * s + lz * c;
  const worldNX = normalX * c + normalZ * s;
  const worldNZ = -normalX * s + normalZ * c;

  return {
    hit: true,
    x: worldX + worldNX * penetration,
    z: worldZ + worldNZ * penetration,
    nx: worldNX,
    nz: worldNZ
  };
}

/**
 * Camera obstruction test: first entry point of a segment into a padded box.
 * Returns a t in [0, 1], or null when the segment is clear or starts inside.
 */
export function segmentBoxHit(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  box: Box2D,
  padding = 0.8,
  fromY = 0,
  toY = 0
): number | null {
  if (box.h !== undefined && Math.min(fromY, toY) > box.h + padding) return null;

  const c = Math.cos(box.rot);
  const s = Math.sin(box.rot);
  const fdx = fromX - box.x;
  const fdz = fromZ - box.z;
  const tdx = toX - box.x;
  const tdz = toZ - box.z;

  const fx = fdx * c - fdz * s;
  const fz = fdx * s + fdz * c;
  const tx = tdx * c - tdz * s;
  const tz = tdx * s + tdz * c;

  const halfW = box.w / 2 + padding;
  const halfD = box.d / 2 + padding;
  const dx = tx - fx;
  const dz = tz - fz;

  let tMin = 0;
  let tMax = 1;

  for (const [origin, dir, half] of [
    [fx, dx, halfW],
    [fz, dz, halfD]
  ] as const) {
    if (Math.abs(dir) < 1e-8) {
      if (origin < -half || origin > half) return null;
      continue;
    }
    let t1 = (-half - origin) / dir;
    let t2 = (half - origin) / dir;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }

  if (tMin <= 1e-4) return null;
  return tMin <= 1 ? tMin : null;
}

/** Pull the camera to the first obstruction along the target→camera segment. */
export function clearCameraTarget(
  from: Vec3Like,
  to: Vec3Like,
  solids: Box2D[],
  padding = 0.8
): Vec3Like {
  let nearest = 1;
  for (const solid of solids) {
    const t = segmentBoxHit(from.x, from.z, to.x, to.z, solid, padding, from.y, to.y);
    if (t !== null && t < nearest) nearest = t;
  }
  if (nearest >= 1) return to;
  const t = Math.max(0.18, nearest - 0.06);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t
  };
}
