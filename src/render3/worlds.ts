import * as THREE from 'three';
import type { ChapterDef } from '../content3/types';
import { buildArena } from './models';
import { buildArenaLayout } from '../sim3d/arena';
import {
  buildBalcony,
  buildCableLine,
  buildCannon,
  buildDeskLamp,
  buildDustField,
  buildGlassCase,
  buildLocket,
  buildMatchbox,
  buildOxygenCylinder,
  buildVent,
  buildMug,
  buildNeedle,
  buildPencil,
  buildRoad,
  buildSatelliteDish,
  buildSolidBlocks,
  buildStreetLamp,
  buildWindowFrame
} from './props';
import { buildDiviner, buildGarva, buildGarvaCar, buildGlassWing, mat } from './models';

function buildLaneWorld(chapter: ChapterDef): THREE.Group {
  const world = new THREE.Group();
  world.add(buildArena(buildArenaLayout(chapter.layoutSeed ?? 7)));
  world.add(buildRoad(16, 200));

  if (chapter.solids && chapter.solids.length > 0) {
    world.add(buildSolidBlocks(chapter.solids));
  }

  const balcony = buildBalcony(14);
  balcony.position.set(0, 6, -26);
  world.add(balcony);

  const locket = buildLocket();
  locket.position.set(1.6, 8.6, -24.2);
  locket.scale.setScalar(0.8);
  world.add(locket);

  for (const x of [-4.6, 4.6]) {
    const window = buildWindowFrame(5, 7);
    window.position.set(x, 14, -29.75);
    world.add(window);
  }
  const door = buildWindowFrame(6, 8);
  door.position.set(0, 9.4, -29.75);
  world.add(door);

  const dish = buildSatelliteDish();
  dish.position.set(-20, 0, 10);
  dish.scale.setScalar(1.2);
  world.add(dish);

  world.add(
    buildCableLine([
      { x: -24, y: 16, z: 24 },
      { x: -8, y: 14, z: 4 },
      { x: 10, y: 15, z: -14 }
    ]),
    buildCableLine([
      { x: 24, y: 13, z: -6 },
      { x: 14, y: 12, z: -20 },
      { x: 2, y: 13, z: -28 }
    ])
  );

  for (const [x, z] of [
    [-9, 16],
    [9, -6],
    [-11, -14]
  ]) {
    const lamp = buildStreetLamp();
    lamp.position.set(x, 0, z);
    world.add(lamp);
  }

  const car = buildGarvaCar();
  car.position.set(0, 0, 30);
  car.rotation.y = Math.PI;
  car.scale.setScalar(1.25);
  world.add(car);

  return world;
}

function buildWorkshopWorld(chapter: ChapterDef): THREE.Group {
  const world = new THREE.Group();

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(70, 2, 60),
    new THREE.MeshLambertMaterial({ color: 0x4a2f1d, })
  );
  desk.position.set(0, -1, 0);
  world.add(desk);

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(90, 46, 2),
    new THREE.MeshLambertMaterial({ color: 0x2a1c14, })
  );
  wall.position.set(0, 22, -32);
  world.add(wall);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 5), mat(0x3a2418));
  shelf.position.set(-16, 16, -30);
  world.add(shelf);

  const window = buildWindowFrame(30, 16);
  window.position.set(0, 22, -30.8);
  world.add(window);

  const dawn = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 14),
    new THREE.MeshBasicMaterial({
      color: 0xffd8a0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    })
  );
  dawn.position.set(0, 22, -30.2);
  world.add(dawn);

  const lamp = buildDeskLamp();
  lamp.position.set(-10, 0, -16);
  lamp.scale.setScalar(1.25);
  world.add(lamp);

  const matchbox = buildMatchbox();
  matchbox.position.set(-10, 0, -4);
  matchbox.rotation.y = 0.18;
  world.add(matchbox);

  const mug = buildMug();
  mug.position.set(9, 0, 2);
  world.add(mug);

  const pencil = buildPencil();
  pencil.position.set(-6, 0.6, 8);
  pencil.rotation.y = 0.55;
  world.add(pencil);

  const needle = buildNeedle();
  needle.position.set(0, 2.2, -10);
  needle.rotation.y = 0.2;
  world.add(needle);

  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.12, 16),
    new THREE.MeshLambertMaterial({ color: 0xd8c8a8, })
  );
  paper.position.set(2, 0.1, 3);
  paper.rotation.y = -0.12;
  world.add(paper);

  world.add(buildDustField(320, 28));

  if (chapter.solids && chapter.solids.length > 0) {
    world.add(buildSolidBlocks(chapter.solids));
  }

  return world;
}

function buildAirportRoadWorld(): THREE.Group {
  const world = new THREE.Group();
  world.add(buildRoad(24, 230));

  const barrierMat = mat(0x3a3e48);
  for (let i = -6; i <= 6; i++) {
    for (const side of [-1, 1]) {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 18), barrierMat);
      barrier.position.set(side * 13, 0.7, i * 20);
      world.add(barrier);
    }
  }

  for (let z = -100; z <= 100; z += 30) {
    for (const side of [-1, 1]) {
      const lamp = buildStreetLamp();
      lamp.position.set(side * 16, 0, z);
      world.add(lamp);
    }
  }

  const gantryMat = mat(0x2a2e38);
  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 17, 7), gantryMat);
    pole.position.set(side * 13, 8.5, 28);
    world.add(pole);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(27, 0.8, 0.8), gantryMat);
  beam.position.set(0, 17, 28);
  world.add(beam);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(12, 3, 0.3),
    mat(0x1a3a5a, { emissive: 0x0a1a2a, ei: 0.5 })
  );
  sign.position.set(0, 14.5, 28);
  world.add(sign);

  const skylineMat = mat(0x141a28);
  for (let i = 0; i < 16; i++) {
    const h = 8 + ((i * 7) % 22);
    const block = new THREE.Mesh(new THREE.BoxGeometry(6, h, 4), skylineMat);
    block.position.set(-60 + i * 8, h / 2, -112);
    world.add(block);
  }

  const skidMat = new THREE.MeshBasicMaterial({ color: 0x060606 });
  for (const x of [-2.2, 2.2]) {
    const skid = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 26), skidMat);
    skid.rotation.x = -Math.PI / 2;
    skid.position.set(x, 0.06, -46);
    world.add(skid);
  }
  const broken = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 8), barrierMat);
  broken.position.set(9, 0.7, -50);
  broken.rotation.z = 0.4;
  world.add(broken);

  return world;
}

function buildChandelier(): THREE.Group {
  const chandelier = new THREE.Group();
  const gold = mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.6 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), gold);
  chandelier.add(core);
  for (const radius of [3.5, 5.2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.18, 6, 22), gold);
    ring.rotation.x = Math.PI / 2;
    chandelier.add(ring);
  }
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      mat(0xfff2c8, { emissive: 0xffd75e, ei: 1.4 })
    );
    crystal.position.set(Math.cos(angle) * 5, -1.4 - (i % 3) * 0.45, Math.sin(angle) * 5);
    chandelier.add(crystal);
  }
  chandelier.name = 'chandelier';
  return chandelier;
}

function buildGarvaHouseWorld(storyProps = true): THREE.Group {
  const world = new THREE.Group();
  const marble = new THREE.MeshLambertMaterial({ color: 0x363c4c });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 90), marble);
  floor.position.set(0, -1, 0);
  world.add(floor);

  const back = new THREE.Mesh(new THREE.BoxGeometry(100, 52, 2), marble);
  back.position.set(0, 26, -45);
  world.add(back);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 52, 90), marble);
    wall.position.set(side * 50, 26, 0);
    world.add(wall);
  }

  const columnMat = mat(0x3a4050);
  for (const x of [-24, 24]) {
    for (const z of [-28, 0, 28]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 44, 12), columnMat);
      column.position.set(x, 22, z);
      world.add(column);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.35 }));
      cap.position.set(x, 44.5, z);
      world.add(cap);
    }
  }

  const chandelier = buildChandelier();
  chandelier.position.set(0, 26, 0);
  world.add(chandelier);

  const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(72, 1, 12), marble);
  mezzanine.position.set(0, 15, -30);
  world.add(mezzanine);
  const mezzRail = new THREE.Mesh(new THREE.BoxGeometry(72, 0.3, 0.3), mat(0x8a94a4));
  mezzRail.position.set(0, 16.2, -24.2);
  world.add(mezzRail);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 40),
    new THREE.MeshLambertMaterial({
      color: 0x8ac8e8,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide
    })
  );
  glass.position.set(0, 26, -43.8);
  world.add(glass);
  for (let i = 0; i < 24; i++) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffd75e })
    );
    light.position.set(-40 + i * 3.4, 14 + (i % 6) * 5, -44.6);
    world.add(light);
  }

  const safe = new THREE.Group();
  const safeBody = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 5), mat(0x2a2e38));
  safeBody.position.y = 4;
  safe.add(safeBody);
  const dial = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.18, 6, 16), mat(0xb8c4d4));
  dial.position.set(0, 4, 2.7);
  safe.add(dial);
  safe.position.set(-18, 0, -22);
  world.add(safe);

  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 6), mat(0x3a2418));
  top.position.y = 6.5;
  desk.add(top);
  for (const x of [-5, 5]) {
    for (const z of [-2, 2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.5, 0.5), mat(0x3a2418));
      leg.position.set(x, 3.2, z);
      desk.add(leg);
    }
  }
  for (let i = 0; i < 4; i++) {
    const ledger = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 3.2), mat(0xd8c8a8));
    ledger.position.set(-3 + i * 2, 7, 0);
    ledger.rotation.y = (i - 1.5) * 0.12;
    desk.add(ledger);
  }
  desk.position.set(18, 0, -22);
  world.add(desk);

  if (storyProps) {
    const display = buildGlassCase();
    display.position.set(0, 12, -26);
    world.add(display);

    const vent = buildVent();
    vent.position.set(0, 20, -34);
    world.add(vent);
  }

  const doorMat = mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.5 });
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 0.6), doorMat);
    door.position.set(side * 5.4, 7, 41);
    world.add(door);
  }

  return world;
}

function buildGlassHouseWorld(): THREE.Group {
  const world = buildGarvaHouseWorld(false);

  const garva = buildGarva();
  garva.position.set(0, 0, -26);
  garva.rotation.y = 0;
  world.add(garva);

  const cannon = buildCannon();
  cannon.position.set(0, 6, -10);
  world.add(cannon);

  const oxygen = buildOxygenCylinder();
  oxygen.position.set(0, 6, -4);
  world.add(oxygen);

  const shardMat = new THREE.MeshLambertMaterial({
    color: 0x9ad4e8,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide
  });
  for (let i = 0; i < 12; i++) {
    const shard = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + (i % 3), 4 + (i % 4)), shardMat);
    shard.position.set(-24 + i * 4.2, 2 + (i % 5) * 2.4, -30 + (i % 3) * 3);
    shard.rotation.set(i * 0.4, i * 0.7, i * 0.2);
    world.add(shard);
  }

  world.add(buildDustField(260, 32));
  return world;
}

function buildDivinerWorld(): THREE.Group {
  const world = new THREE.Group();
  const stone = new THREE.MeshLambertMaterial({ color: 0x2a1a12 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 70), stone);
  floor.position.set(0, -1, 0);
  world.add(floor);

  const back = new THREE.Mesh(new THREE.BoxGeometry(60, 38, 2), stone);
  back.position.set(0, 19, -35);
  world.add(back);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 38, 70), stone);
    wall.position.set(side * 30, 19, 0);
    world.add(wall);
  }

  const clothMat = new THREE.MeshLambertMaterial({ color: 0x6a1a12 });
  for (const x of [-18, -6, 6, 18]) {
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(9, 22), clothMat);
    cloth.position.set(x, 18, -33.8);
    world.add(cloth);
  }

  const circleMat = new THREE.MeshBasicMaterial({
    color: 0xff7a3d,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide
  });
  for (const radius of [11, 7.5]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.35, 48), circleMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.08, -12);
    world.add(ring);
  }
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 3.2), circleMat);
    mark.position.set(Math.cos(angle) * 9.2, 0.1, -12 + Math.sin(angle) * 9.2);
    mark.rotation.y = -angle;
    world.add(mark);
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.4, 7), mat(0xd8c8a8));
      candle.position.set(side * (8 + i * 2), 1.2, -18);
      world.add(candle);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 1.1, 6),
        mat(0xffb060, { emissive: 0xff7a3d, ei: 3 })
      );
      flame.position.set(side * (8 + i * 2), 2.9, -18);
      world.add(flame);
    }
  }

  for (let i = 0; i < 7; i++) {
    const x = -18 + i * 6;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 8, 4), mat(0x6a6470));
    chain.position.set(x, 28, -20 + (i % 2) * 4);
    world.add(chain);
    const charm = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.16, 5, 12), mat(0xd8b060, { emissive: 0x8a5a10, ei: 0.5 }));
    charm.position.set(x, 24, -20 + (i % 2) * 4);
    charm.rotation.x = Math.PI / 2;
    world.add(charm);
  }

  const diviner = buildDiviner();
  diviner.position.set(0, 0, -26);
  world.add(diviner);

  for (const side of [-1, 1]) {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 1.1, 10), mat(0x3a2418));
    bowl.position.set(side * 12, 0.6, -18);
    world.add(bowl);
    const fire = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.6, 7),
      mat(0xff7a3d, { emissive: 0xff4a1d, ei: 2.6 })
    );
    fire.position.set(side * 12, 2.4, -18);
    world.add(fire);
  }

  const doorMat = mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.5 });
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 0.6), doorMat);
    door.position.set(side * 4.5, 6, 31);
    world.add(door);
  }

  return world;
}

export function buildChapterWorld(chapter: ChapterDef): THREE.Group {
  switch (chapter.location) {
    case 'workshop':
      return buildWorkshopWorld(chapter);
    case 'airport-road':
      return buildAirportRoadWorld();
    case 'garva-house':
      return buildGarvaHouseWorld();
    case 'diviner-room':
      return buildDivinerWorld();
    case 'glass-house':
      return buildGlassHouseWorld();
    default:
      return buildLaneWorld(chapter);
  }
}

/** The Storyteller's bench: lamp, glass wing, the city beyond. */
export function buildHubWorld(): THREE.Group {
  const world = new THREE.Group();

  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(70, 2, 50),
    new THREE.MeshLambertMaterial({ color: 0x3a2418, })
  );
  desk.position.set(0, -1, 0);
  world.add(desk);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(90, 50, 2),
    new THREE.MeshLambertMaterial({ color: 0x0a0c16, })
  );
  back.position.set(0, 24, -26);
  world.add(back);

  const lamp = buildDeskLamp();
  lamp.position.set(-12, 0, -8);
  lamp.scale.setScalar(1.7);
  world.add(lamp);

  const wing = buildGlassWing();
  wing.position.set(2, 12, -2);
  wing.scale.setScalar(2.2);
  wing.rotation.x = -0.4;
  wing.rotation.z = 0.2;
  world.add(wing);

  const silhouette = new THREE.Group();
  const palette = [0x1a2038, 0x222a44, 0x161c30];
  let seed = 21;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 18; i++) {
    const w = 4 + rand() * 8;
    const h = 8 + rand() * 26;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 4),
      new THREE.MeshLambertMaterial({ color: palette[i % palette.length], })
    );
    block.position.set(-40 + i * 4.8, h / 2, -22 - rand() * 8);
    silhouette.add(block);
  }
  world.add(silhouette);

  world.add(buildDustField(220, 30));

  return world;
}
