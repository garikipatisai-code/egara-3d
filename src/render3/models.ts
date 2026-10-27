import * as THREE from 'three';
import type { Building } from '../sim3d/arena';
import type { ShardMotif } from '../content3/types';
import { textured } from './materials';
import { glowSprite } from './glow';
import { facadeTexture } from './textures';

/** Procedural low-poly models. Zero downloads, all original. */

export function mat(color: number, opts: { emissive?: number; ei?: number } = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.ei ?? 1,
    flatShading: true
  });
}

/** Gali the fly: segmented body, iridescent double wings, big eyes. */
export function buildGali(): THREE.Group {
  const gali = new THREE.Group();
  const amber = new THREE.MeshStandardMaterial({
    color: 0xe8b04b,
    roughness: 0.5,
    metalness: 0.2,
    flatShading: false
  });
  const dark = mat(0x4a2f1d);

  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 10), amber);
  abdomen.scale.set(0.95, 0.8, 1.15);
  abdomen.position.z = -0.38;
  gali.add(abdomen);

  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 10), amber);
  thorax.scale.set(0.92, 0.86, 1.05);
  thorax.position.z = 0.28;
  gali.add(thorax);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), amber);
  head.scale.set(1, 0.94, 0.85);
  head.position.z = 0.86;
  gali.add(head);

  const stripes = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.075, 7, 16), dark);
  stripes.rotation.x = Math.PI / 2;
  stripes.position.z = -0.22;
  stripes.scale.set(1, 1, 0.82);
  gali.add(stripes);

  const eyeGeo = new THREE.SphereGeometry(0.25, 14, 10);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x3fa7d6,
    emissive: 0x1d5f7e,
    emissiveIntensity: 0.7,
    roughness: 0.18,
    metalness: 0.25
  });
  const highlight = new THREE.MeshBasicMaterial({ color: 0xe8fbff });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.scale.set(0.9, 1, 0.62);
    eye.position.set(side * 0.22, 0.16, 1.05);
    gali.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 5), highlight);
    glint.position.set(side * 0.2, 0.23, 1.2);
    gali.add(glint);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.55, 5), dark);
    antenna.position.set(side * 0.16, 0.36, 1.18);
    antenna.rotation.set(0.8, 0, side * 0.25);
    gali.add(antenna);
  }

  const wingGeo = new THREE.PlaneGeometry(1.05, 0.62);
  const wingMats = [
    new THREE.MeshStandardMaterial({
      color: 0xd8f4ff,
      emissive: 0x2a6a7a,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      roughness: 0.15,
      metalness: 0.3,
      depthWrite: false
    }),
    new THREE.MeshStandardMaterial({
      color: 0xffe9b0,
      emissive: 0x7a5a1a,
      emissiveIntensity: 0.28,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide,
      roughness: 0.2,
      depthWrite: false
    })
  ];
  for (const side of [-1, 1]) {
    for (let layer = 0; layer < 2; layer++) {
      const wing = new THREE.Mesh(wingGeo, wingMats[layer]);
      wing.position.set(side * (0.52 + layer * 0.08), 0.44 + layer * 0.03, -0.02);
      wing.rotation.set(-0.5, side * -0.28, side * (0.5 + layer * 0.1));
      wing.name = `${side < 0 ? 'wingL' : 'wingR'}${layer === 1 ? 'Blur' : ''}`;
      gali.add(wing);
    }
  }

  const legMat = mat(0x1a1420);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.6, 5), legMat);
      leg.position.set(side * 0.42, -0.34, 0.42 - i * 0.32);
      leg.rotation.z = side * 0.95;
      leg.rotation.x = 0.2 - i * 0.2;
      gali.add(leg);
    }
  }

  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 7), dark);
  sting.position.set(0, -0.06, -0.98);
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
    textured('concrete', 0x364056, { repeatX: 10, repeatY: 10, roughness: 0.95 })
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
    const base = palette[block.colorIdx % palette.length];
    const facade = facadeTexture(`#${base.toString(16).padStart(6, '0')}`);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(block.w, block.h, block.d),
      new THREE.MeshStandardMaterial({
        map: facade,
        bumpMap: facade,
        bumpScale: 0.02,
        roughness: 0.84,
        metalness: 0.06
      })
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
  const sari = textured('fabric', 0x2e6f6a, { repeatX: 2, repeatY: 2, roughness: 0.9 });
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

  const gold = mat(0xe8b04b, { emissive: 0x8a5a10, ei: 0.55 });
  for (const side of [-1, 1]) {
    for (let bangle = 0; bangle < 3; bangle++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.16, 5, 14), gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(side * 6.8, 9.2 + bangle * 0.42, 5.6);
      maker.add(ring);
    }
    const earring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.1, 5, 12), gold);
    earring.position.set(side * 3.7, 27.7, 0.2);
    maker.add(earring);
  }

  const pallu = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 13),
    textured('fabric', 0x2e6f6a, { repeatX: 2, repeatY: 3, roughness: 0.9 })
  );
  pallu.position.set(-4.8, 17.5, 4.9);
  pallu.rotation.z = -0.16;
  pallu.rotation.x = 0.08;
  maker.add(pallu);

  const strands = mat(0x1c1418);
  for (let i = 0; i < 7; i++) {
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 7, 4), strands);
    strand.position.set(-3.6 + i * 1.2, 27.2, -3.3);
    strand.rotation.x = 0.12;
    maker.add(strand);
  }

  maker.name = 'shilpi';
  return maker;
}

/** Garva's car: long, dark, glass roof. Silhouette first. */
export function buildGarvaCar(): THREE.Group {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(13, 3.2, 6.4),
    textured('metal', 0x14161c, { repeatX: 3, repeatY: 1, roughness: 0.34, metalness: 0.7 })
  );
  body.position.y = 2.2;
  car.add(body);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.2, 6),
    textured('metal', 0x1c1f28, { roughness: 0.4, metalness: 0.6 })
  );
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
    const halo = glowSprite(0xffe9a8, 2.8, 0.4);
    halo.position.copy(light.position);
    car.add(light, halo);

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
  shard.add(halo, glowSprite(color, 3.2, 0.45));
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
  const robe = textured('fabric', robeColor, { repeatX: 2, repeatY: 2, roughness: 0.95 });
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

  const beard = new THREE.Mesh(new THREE.ConeGeometry(2.1, 5, 7), mat(0xc8c0b8));
  beard.position.set(0, 19.4, 3.3);
  beard.rotation.x = Math.PI;
  diviner.add(beard);

  diviner.name = 'diviner';
  return diviner;
}

/** Garva: a tall suited industrialist. Original design, no likeness. */
export function buildGarva(): THREE.Group {
  const garva = new THREE.Group();
  const suit = textured('fabric', 0x242833, { repeatX: 2, repeatY: 2, roughness: 0.82 });
  const shirt = textured('paper', 0xd8d0c0, { roughness: 0.8 });
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

  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 7, 0.35), suit);
    lapel.position.set(side * 2.1, 21.2, 4.8);
    lapel.rotation.z = side * -0.18;
    garva.add(lapel);
  }
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.9, 0.2), shirt);
  pocket.position.set(2.8, 22.4, 4.75);
  garva.add(pocket);
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.2), hair);
    brow.position.set(side * 1.2, 32.4, 3.4);
    brow.rotation.z = side * 0.12;
    garva.add(brow);
  }

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
