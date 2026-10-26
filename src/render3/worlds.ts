import * as THREE from 'three';
import type { ChapterDef } from '../content3/types';
import { buildArena } from './models';
import { buildArenaLayout } from '../sim3d/arena';
import {
  buildBalcony,
  buildCableLine,
  buildDeskLamp,
  buildDustField,
  buildLocket,
  buildMatchbox,
  buildMug,
  buildNeedle,
  buildPencil,
  buildRoad,
  buildSatelliteDish,
  buildSolidBlocks,
  buildStreetLamp,
  buildWindowFrame
} from './props';
import { buildGarvaCar, buildGlassWing, mat } from './models';

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

export function buildChapterWorld(chapter: ChapterDef): THREE.Group {
  if (chapter.location === 'workshop') return buildWorkshopWorld(chapter);
  return buildLaneWorld(chapter);
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
