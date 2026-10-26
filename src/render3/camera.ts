import * as THREE from 'three';

/** Chase camera: behind + above, look-ahead, lerp follow, shake, FOV punch. */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private shake = 0;
  private fovKick = 0;
  private readonly baseFov = 62;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 600);
    this.camera.position.set(0, 8, 16);
  }

  addShake(amount: number): void {
    this.shake = Math.min(1, this.shake + amount);
  }

  punchFov(): void {
    this.fovKick = 1;
  }

  update(dt: number, target: THREE.Vector3, yaw: number, pitch: number): void {
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.fovKick = Math.max(0, this.fovKick - dt * 3);

    const back = 11;
    const up = 5.2;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const desired = new THREE.Vector3(
      target.x - fx * back,
      target.y + up - pitch * 6,
      target.z - fz * back
    );
    const k = 1 - Math.exp(-dt * 5);
    this.camera.position.lerp(desired, k);

    const ahead = new THREE.Vector3(
      target.x + fx * 8,
      target.y + Math.sin(pitch) * 8,
      target.z + fz * 8
    );
    this.camera.lookAt(ahead);

    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.6;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }

    const fov = this.baseFov + this.fovKick * 9;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
