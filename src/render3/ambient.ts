import * as THREE from 'three';
import { textured } from './materials';
import { mat as modelMat } from './models';

export type HumanKind = 'vendor' | 'passer' | 'child' | 'guard' | 'agent';

export function buildHuman(kind: HumanKind): THREE.Group {
  const human = new THREE.Group();
  const skin = modelMat(0xa8704e);
  const hair = modelMat(0x1a1418);
  const shirt =
    kind === 'guard'
      ? textured('fabric', 0x1a2438, { repeatX: 1, repeatY: 2, roughness: 0.9 })
      : kind === 'vendor'
        ? textured('fabric', 0xd8c8a0, { repeatX: 1, repeatY: 2, roughness: 0.95 })
        : kind === 'passer'
          ? textured('fabric', 0x2a5a6a, { repeatX: 1, repeatY: 2, roughness: 0.9 })
          : textured('fabric', 0x7a2a4a, { repeatX: 1, repeatY: 2, roughness: 0.9 });
  const trousers = textured('fabric', 0x1a1c24, { repeatX: 1, repeatY: 2, roughness: 0.9 });
  const scale = kind === 'child' ? 0.62 : kind === 'guard' ? 1.12 : 1;

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 3.2, 7), trousers);
    leg.position.set(side * 0.6, 1.6, 0);
    human.add(leg);
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 3.4, 8), shirt);
  torso.position.y = 4.6;
  human.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(1.75, 8, 6), shirt);
  shoulders.scale.set(1, 0.4, 0.75);
  shoulders.position.y = 6.2;
  human.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.7, 6), skin);
  neck.position.y = 6.7;
  human.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), skin);
  head.position.y = 7.7;
  human.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(1.07, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair
  );
  hairCap.position.y = 7.9;
  human.add(hairCap);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 3, 6), skin);
    arm.position.set(side * 1.9, 4.8, 0);
    arm.rotation.z = side * 0.18;
    human.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 5), skin);
    hand.position.set(side * 2.15, 3.2, 0);
    human.add(hand);
  }

  if (kind === 'vendor') {
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.1, 0.2),
      textured('fabric', 0x8a6a4a, { repeatX: 1, repeatY: 1, roughness: 0.95 })
    );
    apron.position.set(0, 4.1, 1.5);
    human.add(apron);
  }
  if (kind === 'guard') {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.2, 0.35, 10),
      textured('fabric', 0x0a1428, { roughness: 0.9 })
    );
    cap.position.y = 8.65;
    human.add(cap);
  }

  human.scale.setScalar(scale);
  human.userData.ambient = { phase: Math.random() * Math.PI * 2, speed: 0.25 + Math.random() * 0.2 };
  human.name = `human-${kind}`;
  return human;
}

/** A parked city bus, used as a scale landmark at the airport. */
export function buildBus(): THREE.Group {
  const bus = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(14, 3.4, 4),
    textured('metal', 0x8a2a2a, { roughness: 0.55, metalness: 0.3 })
  );
  body.position.y = 2.6;
  bus.add(body);
  const windows = new THREE.Mesh(
    new THREE.BoxGeometry(12.8, 1.2, 4.05),
    new THREE.MeshStandardMaterial({
      color: 0x8ac8e8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.4
    })
  );
  windows.position.y = 3.6;
  bus.add(windows);
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 10), modelMat(0x0a0a0c));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(front * 4.5, 1, side * 2.1);
      bus.add(wheel);
    }
  }
  bus.name = 'bus';
  return bus;
}

/** A distant airliner silhouette; no airline marks. */
export function buildPlane(): THREE.Group {
  const plane = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 30, 12),
    textured('metal', 0xc8d0dc, { roughness: 0.4, metalness: 0.55, repeatX: 4, repeatY: 1 })
  );
  body.rotation.z = Math.PI / 2;
  plane.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 12), modelMat(0xc8d0dc));
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 17.5;
  plane.add(nose);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.4, 10),
      textured('metal', 0xb8c0cc, { roughness: 0.45, metalness: 0.5 })
    );
    wing.position.set(-1, -0.4, side * 8);
    wing.rotation.y = side * 0.08;
    plane.add(wing);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 7), modelMat(0xb8c0cc));
  tail.position.set(-13, 3, 0);
  tail.rotation.z = 0.3;
  plane.add(tail);
  plane.name = 'plane';
  return plane;
}
