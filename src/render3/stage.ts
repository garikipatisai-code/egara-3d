import * as THREE from 'three';
import { buildArena, buildDrone, buildGali } from './models';
import { ChaseCamera } from './camera';
import { ParticlePool } from './particles';
import type { World } from '../sim3d/flight';

/** Owns everything three.js: scene, lights, actors, camera, particles. */
export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly chase: ChaseCamera;
  private readonly gali: THREE.Group;
  private readonly drones: THREE.Group[] = [];
  private readonly particles = new ParticlePool();
  private time = 0;
  private drawCalls = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.scene.background = new THREE.Color(0x111a38);
    this.scene.fog = new THREE.Fog(0x111a38, 60, 220);

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      const r = 420;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) + 10;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false, fog: false })
    );
    this.scene.add(stars);

    const hemi = new THREE.HemisphereLight(0x9abcf8, 0x3a4666, 1.8);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe9c0, 3.2);
    sun.position.set(40, 80, 20);
    this.scene.add(sun);
    const ember = new THREE.PointLight(0xff9a3d, 120, 110, 1.8);
    ember.position.set(0, 14, -40);
    this.scene.add(ember);

    this.scene.add(buildArena());

    this.gali = buildGali();
    this.scene.add(this.gali);

    for (let i = 0; i < 12; i++) {
      const drone = buildDrone();
      drone.visible = false;
      this.drones.push(drone);
      this.scene.add(drone);
    }

    this.scene.add(this.particles.points);
    this.chase = new ChaseCamera(window.innerWidth / window.innerHeight);

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.chase.setAspect(window.innerWidth / window.innerHeight);
    });
  }

  /** Push sim state into scene objects. Render-only; never writes the sim. */
  sync(world: World, dt: number): void {
    this.time += dt;
    const p = world.player;

    this.gali.position.set(p.pos.x, p.pos.y, p.pos.z);
    this.gali.rotation.set(0, p.yaw, 0);
    this.gali.rotateX(-p.pitch);
    this.gali.visible = p.alive;
    const flap = Math.sin(this.time * 38) * 0.55;
    const wingL = this.gali.getObjectByName('wingL');
    const wingR = this.gali.getObjectByName('wingR');
    if (wingL) wingL.rotation.z = 0.5 + flap;
    if (wingR) wingR.rotation.z = -0.5 - flap;

    world.foes.forEach((foe, i) => {
      const drone = this.drones[i];
      if (!drone) return;
      drone.visible = foe.alive;
      if (!foe.alive) return;
      drone.position.set(foe.pos.x, foe.pos.y, foe.pos.z);
      drone.lookAt(p.pos.x, p.pos.y, p.pos.z);
      const glow = drone.getObjectByName('glow') as THREE.Mesh | undefined;
      if (glow) {
        const s = 1 + Math.sin(this.time * 6 + i) * 0.15;
        glow.scale.setScalar(s);
      }
    });

    const target = new THREE.Vector3(p.pos.x, p.pos.y, p.pos.z);
    this.chase.update(dt, target, p.yaw, p.pitch);
  }

  burst(x: number, y: number, z: number, big: boolean): void {
    this.particles.burst(x, y, z, big ? 26 : 12, big ? 0xffb060 : 0xffe9a8, big ? 14 : 9, 0.7);
    this.particles.burst(x, y, z, big ? 8 : 4, 0xd05a5a, 6, 1);
  }

  punch(): void {
    this.chase.addShake(0.45);
    this.chase.punchFov();
  }

  hurtShake(): void {
    this.chase.addShake(0.7);
  }

  render(dt: number): void {
    this.particles.update(dt);
    this.renderer.render(this.scene, this.chase.camera);
    this.drawCalls = this.renderer.info.render.calls;
  }

  get fpsDrawCalls(): number {
    return this.drawCalls;
  }
}
