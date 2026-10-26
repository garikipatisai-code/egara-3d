import * as THREE from 'three';
import type { Building } from '../sim3d/arena';
import type { ShardMotif } from '../content3/types';

/** Procedural low-poly models. Zero downloads, all original. */

export function mat(color: number, opts: { emissive?: number; ei?: number } = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.ei ?? 1,
    flatShading: true
  });
}

/** Gali the fly: amber body, big blue eyes, beating wings, legs, stinger. */
export function buildGali(): THREE.Group {
  const gali = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(0xe8b04b));
  body.scale.set(1, 0.85, 1.35);
  gali.add(body);

  const stripes = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 14), mat(0x4a2f1d));
  stripes.rotation.x = Math.PI / 2;
  stripes.position.z = -0.1;
  stripes.scale.set(1, 1, 0.8);
  gali.add(stripes);

  const eyeGeo = new THREE.SphereGeometry(0.22, 10, 8);
  const eyeMat = mat(0x3fa7d6, { emissive: 0x1d5f7e, ei: 0.6 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.28, 0.18, 0.55);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.28, 0.18, 0.55);
  gali.add(eyeL, eyeR);

  const wingGeo = new THREE.PlaneGeometry(0.9, 0.55);
  const wingMat = new THREE.MeshLambertMaterial({
    color: 0xcfe8ef,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide
  });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.55, 0.42, -0.05);
  wingL.rotation.set(-0.5, 0.3, 0.5);
  wingL.name = 'wingL';
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(0.55, 0.42, -0.05);
  wingR.rotation.set(-0.5, -0.3, -0.5);
  wingR.name = 'wingR';
  gali.add(wingL, wingR);

  const legMat = mat(0x1a1420);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 5), legMat);
      leg.position.set(side * 0.5, -0.35, 0.3 - i * 0.3);
      leg.rotation.z = side * 0.9;
      gali.add(leg);
    }
  }

  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.35, 6), mat(0x4a2f1d));
  sting.position.set(0, -0.05, -0.85);
  sting.rotation.x = -Math.PI / 2;
  gali.add(sting);

  return gali;
}

/** Swatter drone: red mesh plane, grey handle, angry eyes. */
export function buildDrone(): THREE.Group {
  const drone = new THREE.Group();

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.1), mat(0xd05a5a));
  mesh.position.y = 0.35;
  drone.add(mesh);

  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.2), mat(0x8e2f2f));
  rim.position.y = 0.3;
  drone.add(rim);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 6), mat(0x8a8598));
  handle.position.y = -0.5;
  drone.add(handle);

  const eyeGeo = new THREE.SphereGeometry(0.13, 8, 6);
  const eyeMat = mat(0xffffff, { emissive: 0xffffff, ei: 0.4 });
  const pupMat = mat(0x14101c);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.35, 0.42, 0.45);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), pupMat);
    pup.position.set(side * 0.35, 0.42, 0.56);
    drone.add(eye, pup);
  }

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    mat(0xff9a3d, { emissive: 0xff9a3d, ei: 2 })
  );
  glow.position.set(0, -1.1, 0);
  glow.name = 'glow';
  drone.add(glow);

  return drone;
}

/** Greybox street canyon built from the shared sim layout: what you see is solid. */
export function buildArena(layout: Building[]): THREE.Group {
  const arena = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(130, 40),
    new THREE.MeshLambertMaterial({ color: 0x2a3450, })
  );
  ground.rotation.x = -Math.PI / 2;
  arena.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(118, 122, 48),
    new THREE.MeshBasicMaterial({ color: 0xe8b04b, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  arena.add(ring);

  const palette = [0x3a4a6e, 0x4a3a5e, 0x3a5a4e, 0x5a4a3a];
  for (const block of layout) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d),
      mat(palette[block.colorIdx % palette.length])
    );
    mesh.position.set(block.x, block.h / 2, block.z);
    mesh.rotation.y = block.rot;
    arena.add(mesh);
  }

  return arena;
}

/**
 * Shilpi: a stylised maker, original design. Low-poly, no likeness.
 * Built at human proportions; the caller scales her to the macro world.
 */
export function buildShilpi(): THREE.Group {
  const maker = new THREE.Group();
  const sari = mat(0x2e6f6a);
  const skin = mat(0xb77a52);
  const hair = mat(0x1c1418);

  const lap = new THREE.Mesh(new THREE.CylinderGeometry(7, 8.5, 8, 10), sari);
  lap.position.y = 6;
  maker.add(lap);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7, 12, 10), sari);
  torso.position.y = 16;
  maker.add(torso);

  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(6.4, 10, 8), sari);
  shoulder.scale.set(1, 0.45, 0.8);
  shoulder.position.y = 22;
  maker.add(shoulder);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 3, 8), skin);
  neck.position.y = 24.5;
  maker.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 10), skin);
  head.position.y = 29;
  head.scale.set(0.92, 1.05, 0.9);
  maker.add(head);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), hair);
  bun.position.set(0, 31.5, -2.8);
  maker.add(bun);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(4.3, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.position.y = 29.2;
  maker.add(hairCap);

  const eyeMat = mat(0x141018, { emissive: 0x000000 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 5), eyeMat);
    eye.position.set(side * 1.4, 29.4, 3.7);
    maker.add(eye);
  }

  const armGeo = new THREE.CylinderGeometry(1.5, 1.35, 12, 8);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, skin);
    arm.position.set(side * 6.2, 15.5, 1.2);
    arm.rotation.z = side * -0.38;
    arm.rotation.x = -0.55;
    maker.add(arm);

    const hand = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 6), skin);
    palm.scale.set(1, 0.55, 1.3);
    hand.add(palm);
    for (let finger = 0; finger < 4; finger++) {
      const digit = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 3.4, 5), skin);
      digit.position.set((finger - 1.5) * 0.9, 0.1, 2.1);
      digit.rotation.x = Math.PI / 2.1;
      hand.add(digit);
    }
    hand.position.set(side * 6.8, 9.2, 5.6);
    maker.add(hand);
  }

  const bindi = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 6, 5),
    mat(0xb03030, { emissive: 0x6a1010, ei: 0.5 })
  );
  bindi.position.set(0, 30.2, 3.85);
  maker.add(bindi);

  maker.name = 'shilpi';
  return maker;
}

/** Garva's car: long, dark, glass roof. Silhouette first. */
export function buildGarvaCar(): THREE.Group {
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(13, 3.2, 6.4), mat(0x14161c));
  body.position.y = 2.2;
  car.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 6), mat(0x1c1f28));
  nose.position.set(6.5, 1.9, 0);
  car.add(nose);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 2.4, 5.6),
    new THREE.MeshLambertMaterial({
      color: 0x9ad4e8,
      transparent: true,
      opacity: 0.4
    })
  );
  glass.position.set(-0.6, 4.6, 0);
  car.add(glass);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.25, 5.8), mat(0x0c0e12));
  roof.position.set(-0.6, 5.9, 0);
  car.add(roof);

  const tyre = new THREE.CylinderGeometry(1.8, 1.8, 1.2, 10);
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      const wheel = new THREE.Mesh(tyre, mat(0x0a0a0c));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(front * 4.4, 1.4, side * 3.2);
      car.add(wheel);
    }
  }

  for (const side of [-1, 1]) {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 8, 6),
      mat(0xfff2c8, { emissive: 0xffe9a8, ei: 3 })
    );
    light.position.set(8.3, 2.4, side * 2.1);
    car.add(light);

    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 8, 6),
      mat(0xff3a2a, { emissive: 0xff2a1a, ei: 2.4 })
    );
    tail.position.set(-6.6, 2.6, side * 2.1);
    car.add(tail);
  }

  car.name = 'garva-car';
  return car;
}

const MOTIF_COLOR: Record<ShardMotif, number> = {
  hand: 0xffc98a,
  locket: 0xffd75e,
  phone: 0x8ad8ff,
  car: 0xff8a6a,
  needle: 0xd8e8ff,
  lamp: 0xffb060,
  wing: 0xbfe8ef,
  eye: 0x7ad8ff
};

/** Memory shard: a bright, readable octahedron with a slow halo. */
export function buildShard(motif: ShardMotif): THREE.Group {
  const shard = new THREE.Group();
  const color = MOTIF_COLOR[motif];
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    mat(color, { emissive: color, ei: 1.8 })
  );
  shard.add(core);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.045, 5, 18),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
  );
  halo.rotation.x = Math.PI / 2.4;
  shard.add(halo);
  shard.name = `shard-${motif}`;
  return shard;
}

/** Flyswatter hazard: red mesh, long handle, no face. */
export function buildSwatterProp(): THREE.Group {
  const swatter = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.18, 5.4),
    new THREE.MeshLambertMaterial({
      color: 0xc84a4a,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    })
  );
  mesh.position.y = 0.2;
  swatter.add(mesh);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.22, 5.8), mat(0x8e2f2f));
  rim.position.y = 0.12;
  swatter.add(rim);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 12, 7), mat(0x6a6470));
  handle.position.y = -6;
  swatter.add(handle);
  swatter.name = 'swatter';
  return swatter;
}

/** Tweezers hazard: two steel prongs. */
export function buildTweezerProp(): THREE.Group {
  const tweezer = new THREE.Group();
  const steel = mat(0xb8c4d4);
  for (const side of [-1, 1]) {
    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 8), steel);
    prong.position.set(side * 0.7, 0, 0);
    prong.rotation.z = side * 0.06;
    tweezer.add(prong);
  }
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), steel);
  pivot.position.z = -4.2;
  tweezer.add(pivot);
  tweezer.name = 'tweezer';
  return tweezer;
}

/** The Diviner: a robed, masked ritualist. Original design, no likeness. */
export function buildDiviner(): THREE.Group {
  const diviner = new THREE.Group();
  const robeColor = 0x4a1a1a;
  const robe = mat(robeColor);
  const skin = mat(0x8a5a3a);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(6.4, 17, 10), robe);
  skirt.position.y = 8.5;
  diviner.add(skirt);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.4, 8, 10), robe);
  torso.position.y = 17;
  diviner.add(torso);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(5.2, 10, 8), robe);
  shoulders.scale.set(1, 0.42, 0.8);
  shoulders.position.y = 21;
  diviner.add(shoulders);

  const hood = new THREE.Mesh(new THREE.SphereGeometry(4.4, 12, 10), robe);
  hood.position.y = 24;
  hood.scale.set(1, 1.1, 1);
  diviner.add(hood);

  const face = new THREE.Mesh(new THREE.SphereGeometry(3.1, 10, 8), skin);
  face.position.set(0, 23.6, 2.2);
  face.scale.set(0.9, 1, 0.6);
  diviner.add(face);

  const eyeMat = mat(0xffd75e, { emissive: 0xff9a3d, ei: 2.4 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 6, 5), eyeMat);
    eye.position.set(side * 1.2, 23.9, 4.4);
    diviner.add(eye);
  }
  const third = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), eyeMat);
  third.position.set(0, 24.8, 4.3);
  diviner.add(third);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 11, 8), robe);
    arm.position.set(side * 5.2, 18.5, 1.8);
    arm.rotation.z = side * -0.45;
    arm.rotation.x = -0.35;
    diviner.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), skin);
    hand.position.set(side * 7.6, 23.2, 3.2);
    diviner.add(hand);
  }

  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 24, 7), mat(0x2a1c14));
  staff.position.set(8, 12, 1);
  diviner.add(staff);
  const staffRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.22, 6, 16),
    mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.8 })
  );
  staffRing.position.set(8, 25, 1);
  staffRing.rotation.y = Math.PI / 2;
  diviner.add(staffRing);

  const beads = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.22, 5, 18), mat(0xd8b060));
  beads.position.y = 20;
  beads.rotation.x = Math.PI / 2;
  diviner.add(beads);

  diviner.name = 'diviner';
  return diviner;
}

/** Garva: a tall suited industrialist. Original design, no likeness. */
export function buildGarva(): THREE.Group {
  const garva = new THREE.Group();
  const suit = mat(0x242833);
  const shirt = mat(0xd8d0c0);
  const skin = mat(0xa86a4a);
  const hair = mat(0x1a1418);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 14, 8), suit);
    leg.position.set(side * 2.4, 7, 0);
    garva.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 5), mat(0x0a0a0c));
    shoe.position.set(side * 2.4, 0.7, 1.2);
    garva.add(shoe);
  }

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.6, 13, 10), suit);
  torso.position.y = 20;
  garva.add(torso);

  const shirtFront = new THREE.Mesh(new THREE.BoxGeometry(3.2, 7, 0.5), shirt);
  shirtFront.position.set(0, 21, 4.6);
  garva.add(shirtFront);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(1.1, 5.4, 0.3), mat(0x4a1010));
  tie.position.set(0, 20.5, 4.9);
  garva.add(tie);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), suit);
  shoulders.scale.set(1, 0.4, 0.8);
  shoulders.position.y = 26;
  garva.add(shoulders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 2.4, 8), skin);
  neck.position.y = 28;
  garva.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 10), skin);
  head.position.y = 31;
  head.scale.set(0.9, 1.05, 0.92);
  garva.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(3.65, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hair
  );
  hairCap.position.y = 31.3;
  garva.add(hairCap);

  const eyeMat = mat(0x141018);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 5), eyeMat);
    eye.position.set(side * 1.2, 31.2, 3.2);
    garva.add(eye);
  }

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.2, 12, 8), suit);
    arm.position.set(side * 6.2, 18.5, 0.6);
    arm.rotation.z = side * 0.22;
    garva.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), skin);
    hand.position.set(side * 7.5, 12.5, 1.2);
    garva.add(hand);
  }

  const watch = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.18, 5, 12),
    mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.8 })
  );
  watch.position.set(7.5, 14.2, 1.2);
  watch.rotation.x = Math.PI / 2;
  garva.add(watch);

  garva.name = 'garva';
  return garva;
}

/** The glass wing on the Storyteller's bench. */
export function buildGlassWing(): THREE.Group {
  const wing = new THREE.Group();
  const glass = new THREE.MeshLambertMaterial({
    color: 0xbfe8ef,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide
  });
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(2.4, 1.6, 3.6, 0.6, 4.8, -0.4);
  shape.bezierCurveTo(3.2, -1.8, 1.4, -1.4, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape);
  const left = new THREE.Mesh(geometry, glass);
  left.position.set(-0.2, 0, 0);
  left.rotation.x = -Math.PI / 2;
  wing.add(left);
  const right = new THREE.Mesh(geometry, glass);
  right.position.set(0.2, 0, 0);
  right.rotation.x = -Math.PI / 2;
  right.rotation.z = Math.PI;
  right.scale.x = -1;
  wing.add(right);
  const vein = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 4.6, 4),
    mat(0x9fd8e0, { emissive: 0x2a6a72, ei: 0.4 })
  );
  vein.rotation.z = Math.PI / 2;
  wing.add(vein);
  wing.name = 'glass-wing';
  return wing;
}
