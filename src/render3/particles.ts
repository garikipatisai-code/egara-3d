import * as THREE from 'three';

const MAX = 240;

interface P {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

/** Geometry-only particle pool (THREE.Points). No textures, no allocation. */
export class ParticlePool {
  private readonly parts: P[] = [];
  private readonly geo = new THREE.BufferGeometry();
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  readonly points: THREE.Points;

  constructor() {
    for (let i = 0; i < MAX; i++) {
      this.parts.push({ alive: false, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: 1, r: 1, g: 1, b: 1 });
    }
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const material = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.points = new THREE.Points(this.geo, material);
    this.points.frustumCulled = false;
  }

  burst(x: number, y: number, z: number, count: number, color: number, speed: number, life: number): void {
    const c = new THREE.Color(color);
    let spawned = 0;
    for (const part of this.parts) {
      if (spawned >= count) break;
      if (part.alive) continue;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const v = speed * (0.4 + Math.random() * 0.6);
      part.alive = true;
      part.x = x;
      part.y = y;
      part.z = z;
      part.vx = Math.sin(phi) * Math.cos(theta) * v;
      part.vy = Math.cos(phi) * v;
      part.vz = Math.sin(phi) * Math.sin(theta) * v;
      part.life = life * (0.7 + Math.random() * 0.6);
      part.maxLife = part.life;
      part.r = c.r;
      part.g = c.g;
      part.b = c.b;
      spawned++;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < MAX; i++) {
      const part = this.parts[i];
      if (!part.alive) {
        this.pos[i * 3 + 1] = -999;
        continue;
      }
      part.life -= dt;
      if (part.life <= 0) {
        part.alive = false;
        part.y = -999;
        this.pos[i * 3 + 1] = -999;
        continue;
      }
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.z += part.vz * dt;
      part.vy -= 6 * dt;
      const t = part.life / part.maxLife;
      this.pos[i * 3] = part.x;
      this.pos[i * 3 + 1] = part.y;
      this.pos[i * 3 + 2] = part.z;
      this.col[i * 3] = part.r * t;
      this.col[i * 3 + 1] = part.g * t;
      this.col[i * 3 + 2] = part.b * t;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
