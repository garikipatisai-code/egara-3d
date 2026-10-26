import * as THREE from 'three';
import { clearCameraTarget } from '../sim3d/collision';
import type { Building } from '../sim3d/arena';

/** Chase camera: behind + above, look-ahead, lerp follow, shake, FOV punch. */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private shake = 0;
  private fovKick = 0;
  private readonly baseFov = 62;
  private lookYaw = 0;
  private lookPitch = 0;
  private dist = 1;
  private readonly baseBack = 11;
  private readonly baseUp = 5.2;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 600);
    this.camera.position.set(0, 8, 16);
  }

  /** Drag-to-look, like popular 3D games. dx/dy are pixels. */
  addLook(dx: number, dy: number): void {
    this.lookYaw -= dx * 0.005;
    this.lookPitch = THREE.MathUtils.clamp(this.lookPitch - dy * 0.004, -0.7, 0.7);
  }

  addZoom(delta: number): void {
    this.dist = THREE.MathUtils.clamp(this.dist + delta, 0.6, 1.6);
  }

  addShake(amount: number): void {
    this.shake = Math.min(1, this.shake + amount);
  }

  punchFov(): void {
    this.fovKick = 1;
  }

  update(
    dt: number,
    target: THREE.Vector3,
    yaw: number,
    pitch: number,
    roll = 0,
    boost = false,
    solids: Building[] = []
  ): void {
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.fovKick = Math.max(0, this.fovKick - dt * 3);

    const look = yaw + this.lookYaw;
    const back = this.baseBack * this.dist;
    const up = this.baseUp * this.dist;
    const fx = Math.sin(look);
    const fz = Math.cos(look);
    const wanted = {
      x: target.x - fx * back,
      y: target.y + up + this.lookPitch * 10 - pitch * 6,
      z: target.z - fz * back
    };
    const cleared = clearCameraTarget(
      { x: target.x, y: target.y, z: target.z },
      wanted,
      solids
    );
    const desired = new THREE.Vector3(cleared.x, cleared.y, cleared.z);
    const k = 1 - Math.exp(-dt * 6);
    this.camera.position.lerp(desired, k);

    const ahead = new THREE.Vector3(
      target.x + fx * 8,
      target.y + Math.sin(pitch + this.lookPitch) * 8,
      target.z + fz * 8
    );
    const bank = roll * 0.32;
    this.camera.up.set(Math.sin(bank), Math.cos(bank), 0);
    this.camera.lookAt(ahead);

    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.6;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    }

    const fov = this.baseFov + this.fovKick * 9 + (boost ? 4 : 0);
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
