import * as THREE from 'three';
import { mat } from './models';
import { textured, windowMaterial } from './materials';
import { labelTexture } from './textures';
import { glowSprite } from './glow';
import type { Building } from '../sim3d/arena';

/** Hand-built props. All procedural, all original, zero downloads. */

export function buildLocket(): THREE.Group {
  const locket = new THREE.Group();
  const gold = mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.35 });
  const heart = new THREE.Group();
  const lobe = new THREE.SphereGeometry(0.62, 8, 6);
  const left = new THREE.Mesh(lobe, gold);
  left.position.set(-0.36, 0.24, 0);
  heart.add(left);
  const right = new THREE.Mesh(lobe, gold);
  right.position.set(0.36, 0.24, 0);
  heart.add(right);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.15, 8), gold);
  point.position.set(0, -0.4, 0);
  heart.add(point);
  locket.add(heart);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 5, 10), gold);
  loop.position.y = 1.05;
  locket.add(loop);
  locket.scale.setScalar(1.4);
  locket.name = 'locket';
  return locket;
}

export function buildNeedle(): THREE.Group {
  const needle = new THREE.Group();
  const steel = mat(0xd8e4f0, { emissive: 0x1a2430, ei: 0.2 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 7.5, 6), steel);
  shaft.rotation.z = Math.PI / 2;
  needle.add(shaft);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 5, 10), steel);
  eye.position.x = -3.9;
  needle.add(eye);
  needle.name = 'needle';
  return needle;
}

export function buildMatchbox(): THREE.Group {
  const box = new THREE.Group();
  const sleeve = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3.4, 5.6),
    textured('paper', 0x8a3a2a, { repeatX: 2, repeatY: 1, roughness: 0.9 })
  );
  sleeve.position.y = 1.7;
  box.add(sleeve);
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 1.6, 5),
    textured('paper', 0xd8c8a8, { roughness: 0.95 })
  );
  tray.position.y = 1.2;
  box.add(tray);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.8), textured('paper', 0xf0d8a0));
  label.position.set(0, 2.2, 2.82);
  box.add(label);
  box.name = 'matchbox';
  return box;
}

export function buildMug(): THREE.Group {
  const mug = new THREE.Group();
  const ceramic = mat(0xd8d0c0);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.4, 6.6, 14, 1, true), ceramic);
  body.position.y = 3.3;
  mug.add(body);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.45, 14), ceramic);
  base.position.y = 0.22;
  mug.add(base);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.36, 6, 12, Math.PI * 1.25), ceramic);
  handle.position.set(3.6, 3.6, 0);
  handle.rotation.y = Math.PI / 2;
  mug.add(handle);
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 14),
    new THREE.MeshBasicMaterial({ color: 0x2a1408 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 6.4;
  mug.add(coffee);
  mug.name = 'mug';
  return mug;
}

export function buildPencil(): THREE.Group {
  const pencil = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 11, 12),
    textured('wood', 0xd8a020, { repeatX: 1, repeatY: 4, roughness: 0.7 })
  );
  body.rotation.z = Math.PI / 2;
  pencil.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), mat(0x2a1c14));
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 6.2;
  pencil.add(tip);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.8, 6), mat(0xd85a6a));
  eraser.rotation.z = Math.PI / 2;
  eraser.position.x = -5.9;
  pencil.add(eraser);
  pencil.name = 'pencil';
  return pencil;
}

export function buildSatelliteDish(): THREE.Group {
  const dish = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.SphereGeometry(5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.6),
    textured('metal', 0xb8c0cc, { roughness: 0.45, metalness: 0.55, repeatX: 2, repeatY: 2 })
  );
  face.rotation.x = Math.PI / 2;
  face.position.y = 5;
  dish.add(face);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4, 6), mat(0x8a94a4));
  arm.rotation.x = Math.PI / 2.4;
  arm.position.set(0, 6.6, 2.2);
  dish.add(arm);
  const lnb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), mat(0x2a2e38));
  lnb.position.set(0, 7.6, 3.6);
  dish.add(lnb);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 6, 6), mat(0x6a7484));
  pole.position.y = 2.6;
  dish.add(pole);
  dish.name = 'satellite-dish';
  return dish;
}

export function buildWindowFrame(width = 12, height = 14): THREE.Group {
  const frame = new THREE.Group();
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.35),
    textured('wood', 0x3a2a22, { repeatX: 2, repeatY: 2, roughness: 0.85 })
  );
  frame.add(backing);
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1, height - 1),
    windowMaterial(0xffd8a0)
  );
  pane.position.z = 0.2;
  frame.add(pane);
  frame.name = 'window-frame';
  return frame;
}

export function buildBalcony(width = 13): THREE.Group {
  const balcony = new THREE.Group();
  const stone = textured('concrete', 0x5a5660, { repeatX: 4, repeatY: 1, roughness: 0.95 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.6, 5), stone);
  balcony.add(slab);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.18), mat(0x2a2630));
  rail.position.set(0, 2.4, 2.35);
  balcony.add(rail);
  for (let i = -2; i <= 2; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), mat(0x2a2630));
    post.position.set(i * (width / 4.4), 1.2, 2.35);
    balcony.add(post);
  }
  balcony.name = 'balcony';
  return balcony;
}

export function buildDeskLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const metal = mat(0x2a2e38, { emissive: 0x000000 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.7, 12), metal);
  lamp.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 9, 6), metal);
  arm.position.set(0, 5.4, -1.2);
  arm.rotation.x = -0.35;
  lamp.add(arm);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(4.4, 3.2, 12, 1, true),
    new THREE.MeshLambertMaterial({
      color: 0xd8c8a0,
      emissive: 0xffb060,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
    })
  );
  shade.position.set(0, 10, 2.4);
  shade.rotation.x = 0.25;
  lamp.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 10, 8),
    mat(0xfff2c8, { emissive: 0xffe9a8, ei: 3 })
  );
  bulb.position.set(0, 9.4, 2.4);
  lamp.add(bulb);
  lamp.name = 'desk-lamp';
  return lamp;
}

export function buildStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 12, 6), mat(0x2a2e38));
  pole.position.y = 6;
  lamp.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.2), mat(0x2a2e38));
  arm.position.set(1, 12, 0);
  lamp.add(arm);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 8, 6),
    mat(0xffe0a0, { emissive: 0xffc060, ei: 2.4 })
  );
  head.position.set(2, 11.8, 0);
  lamp.add(head);
  lamp.name = 'street-lamp';
  return lamp;
}

export function buildRoad(width = 16, length = 190): THREE.Group {
  const road = new THREE.Group();
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    textured('asphalt', 0x6a6a70, { repeatX: 4, repeatY: 42, roughness: 0.98 })
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = 0.02;
  road.add(asphalt);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8c890 });
  for (let i = -8; i <= 8; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.2), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.045, i * 10);
    road.add(dash);
  }
  road.name = 'road';
  return road;
}

export function buildCableLine(points: { x: number; y: number; z: number }[]): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => new THREE.Vector3(point.x, point.y, point.z))
  );
  const material = new THREE.LineBasicMaterial({ color: 0x1a1c24 });
  return new THREE.Line(geometry, material);
}

export function buildDustField(count = 260, radius = 26): THREE.Points {
  const positions = new Float32Array(count * 3);
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = rand() * radius;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = 1 + rand() * 18;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffd8a0,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
}

export function buildSign(text: string, width = 10, height = 2.5): THREE.Group {
  const sign = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.5, height + 0.5, 0.35),
    textured('metal', 0x2a2e38, { roughness: 0.5, metalness: 0.5 })
  );
  sign.add(frame);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: labelTexture(text) })
  );
  face.position.z = 0.2;
  sign.add(face);
  const halo = glowSprite(0xffb060, width * 1.4, 0.16);
  halo.position.z = -0.3;
  sign.add(halo);
  sign.name = 'sign';
  return sign;
}

export function buildACUnit(): THREE.Group {
  const unit = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.2, 1.5),
    textured('metal', 0x8a94a4, { roughness: 0.6, metalness: 0.35 })
  );
  unit.add(box);
  const fan = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.12, 5, 14),
    textured('metal', 0x3a3e48, { roughness: 0.5, metalness: 0.5 })
  );
  fan.position.z = 0.8;
  unit.add(fan);
  unit.name = 'ac-unit';
  return unit;
}

export function buildPuddle(radius = 3): THREE.Mesh {
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 18),
    new THREE.MeshStandardMaterial({
      color: 0x0a1420,
      roughness: 0.08,
      metalness: 0.65,
      transparent: true,
      opacity: 0.55
    })
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.055;
  puddle.name = 'puddle';
  return puddle;
}

export function buildCannon(): THREE.Group {
  const cannon = new THREE.Group();
  const brass = textured('metal', 0xb08a3a, {
    roughness: 0.35,
    metalness: 0.65,
    emissive: 0x3a2a08,
    emissiveIntensity: 0.25
  });
  const wood = textured('wood', 0x3a2418, { repeatX: 2, repeatY: 2, roughness: 0.9 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 7), wood);
  cannon.add(base);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.7, 12), wood);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 3.2, 1.4, 0);
    cannon.add(wheel);
  }
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.5, 9, 10), brass);
  barrel.rotation.x = -Math.PI / 2;
  barrel.position.set(0, 3.4, -1.8);
  cannon.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.22, 6, 14), brass);
  muzzle.position.set(0, 3.4, -6.2);
  cannon.add(muzzle);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), mat(0x8a94a4));
  ball.position.set(0, 3.8, -5.4);
  cannon.add(ball);
  cannon.name = 'cannon';
  return cannon;
}

export function buildOxygenCylinder(): THREE.Group {
  const tank = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 7, 12),
    textured('metal', 0x2a6a4a, { roughness: 0.4, metalness: 0.55, repeatX: 2, repeatY: 1 })
  );
  body.position.y = 3.5;
  tank.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 1.1, 8), mat(0xb8c4d4));
  cap.position.y = 7.4;
  tank.add(cap);
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.14, 5, 10), mat(0x8a94a4));
  valve.rotation.x = Math.PI / 2;
  valve.position.y = 8.1;
  tank.add(valve);
  tank.name = 'oxygen-cylinder';
  return tank;
}

export function buildGlassCase(): THREE.Group {
  const display = new THREE.Group();
  const frameMat = textured('metal', 0x8a94a4, { roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0xbfe8ef,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), glassMat);
  display.add(glass);
  for (const x of [-4, 4]) {
    for (const z of [-4, 4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 0.3), frameMat);
      post.position.set(x, 0, z);
      display.add(post);
    }
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.3, 8.4), frameMat);
  top.position.y = 4;
  display.add(top);
  const locket = buildLocket();
  locket.position.y = 0.6;
  locket.scale.setScalar(0.55);
  display.add(locket);
  display.name = 'glass-case';
  return display;
}

export function buildVent(): THREE.Group {
  const vent = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(7, 5, 0.6),
    textured('metal', 0x3a3e48, { roughness: 0.55, metalness: 0.45 })
  );
  vent.add(frame);
  for (let i = -2; i <= 2; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.35, 0.3),
      textured('metal', 0x1a1c24, { roughness: 0.5, metalness: 0.5 })
    );
    slat.position.set(0, i * 0.9, 0.4);
    vent.add(slat);
  }
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 4.4),
    new THREE.MeshBasicMaterial({
      color: 0x8ad8ff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  glow.position.z = 0.5;
  vent.add(glow);
  vent.name = 'vent';
  return vent;
}

/** Extra solid blocks declared in chapter data (visual + collision). */
export function buildSolidBlocks(solids: Building[]): THREE.Group {
  const group = new THREE.Group();
  const palette = [0x3a4a6e, 0x4a3a5e, 0x3a5a4e, 0x5a4a3a];
  for (const block of solids) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d),
      textured('concrete', palette[block.colorIdx % palette.length], {
        repeatX: 2,
        repeatY: 2,
        roughness: 0.92
      })
    );
    mesh.position.set(block.x, block.h / 2, block.z);
    mesh.rotation.y = block.rot;
    group.add(mesh);
  }
  return group;
}
