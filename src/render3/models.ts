import * as THREE from 'three';

/** Procedural low-poly models. Zero downloads, all original. */

function mat(color: number, opts: { emissive?: number; ei?: number } = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.1,
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
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xcfe8ef,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    roughness: 0.3
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

/** Greybox street canyon: ground disc + scattered building blocks. */
export function buildArena(): THREE.Group {
  const arena = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(130, 40),
    new THREE.MeshStandardMaterial({ color: 0x2a3450, roughness: 1 })
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
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 26; i++) {
    const w = 6 + rand() * 10;
    const h = 8 + rand() * 26;
    const d = 6 + rand() * 10;
    const angle = rand() * Math.PI * 2;
    const radius = 45 + rand() * 65;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat(palette[i % palette.length])
    );
    block.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
    block.rotation.y = rand() * Math.PI;
    arena.add(block);
  }

  return arena;
}
