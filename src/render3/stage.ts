import * as THREE from 'three';
import {
  buildDrone,
  buildGali,
  buildGarvaCar,
  buildShard,
  buildShilpi,
  buildSwatterProp,
  buildTweezerProp
} from './models';
import { buildChapterWorld, buildHubWorld } from './worlds';
import { ChaseCamera } from './camera';
import { ParticlePool } from './particles';
import { createSky } from './sky';
import { getBlobTexture, glowSprite } from './glow';
import type { ChapterDef } from '../content3/types';
import type { World } from '../sim3d/flight';
import { currentObjective, targetPosition, type StoryState } from '../sim3d/story';

function isStoryState(source: World | StoryState): source is StoryState {
  return (source as StoryState).chapter !== undefined;
}

/** Owns everything three.js: scene, lights, actors, camera, particles. */
export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly chase: ChaseCamera;
  private readonly gali: THREE.Group;
  private readonly drones: THREE.Group[] = [];
  private readonly particles = new ParticlePool();
  private readonly stars: THREE.Points;
  private readonly sky = createSky();
  private readonly blob: THREE.Mesh;
  private readonly moon: THREE.Group;
  private readonly lights = new THREE.Group();
  private shadowSun: THREE.DirectionalLight | null = null;
  private accentLight: THREE.PointLight | null = null;
  private accentBase = 0;
  private quality: 'high' | 'low' = 'high';
  private indoor = false;
  private worldGroup: THREE.Group | null = null;
  private shardsGroup: THREE.Group | null = null;
  private readonly shardMeshes = new Map<string, THREE.Group>();
  private hazardsGroup: THREE.Group | null = null;
  private readonly hazardMeshes: THREE.Object3D[] = [];
  private allyGroup: THREE.Group | null = null;
  private actorGroup: THREE.Group | null = null;
  private readonly actorMeshes = new Map<string, THREE.Group>();
  private nodesGroup: THREE.Group | null = null;
  private readonly nodeMeshes: { objectiveId: string; index: number; mesh: THREE.Group }[] = [];
  private marker: THREE.Group | null = null;
  private hubMode = false;
  private time = 0;
  private drawCalls = 0;
  private reducedMotion = false;
  private renderScale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color('#111a38');
    this.scene.fog = new THREE.Fog('#111a38', 60, 220);
    this.scene.add(this.sky.mesh);

    this.stars = this.buildStars();
    this.scene.add(this.stars);
    this.scene.add(this.lights);

    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: getBlobTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        color: 0x000000
      })
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.position.y = 0.06;
    this.scene.add(this.blob);

    this.moon = new THREE.Group();
    const moonCore = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2c8 })
    );
    const moonGlow = glowSprite(0xffe9c0, 42, 0.32);
    this.moon.add(moonCore, moonGlow);
    this.moon.position.set(-140, 150, -260);
    this.scene.add(this.moon);

    this.gali = buildGali();
    this.markActorShadows(this.gali);
    this.scene.add(this.gali);

    for (let i = 0; i < 12; i++) {
      const drone = buildDrone();
      drone.visible = false;
      this.markActorShadows(drone);
      this.drones.push(drone);
      this.scene.add(drone);
    }

    this.scene.add(this.particles.points);
    this.chase = new ChaseCamera(window.innerWidth / window.innerHeight);
    this.resize();
    this.marker = this.buildMarker();
    this.scene.add(this.marker);

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const width = Math.max(1, Math.round(window.innerWidth * this.renderScale));
    const height = Math.max(1, Math.round(window.innerHeight * this.renderScale));
    this.renderer.setSize(width, height, false);
    this.chase.setAspect(window.innerWidth / window.innerHeight);
  }

  /** Adaptive resolution: the scene stays sharp on capable devices, readable on slow ones. */
  setRenderScale(scale: number): void {
    const next = Math.max(0.5, Math.min(1, scale));
    if (Math.abs(next - this.renderScale) < 0.01) return;
    this.renderScale = next;
    this.resize();
  }

  get renderScaleValue(): number {
    return this.renderScale;
  }

  private buildStars(): THREE.Points {
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
    return new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xcfd8ff,
        size: 1.6,
        sizeAttenuation: false,
        fog: false
      })
    );
  }

  private buildMarker(): THREE.Group {
    const marker = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffd75e,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 6, 24), material);
    ring.rotation.x = Math.PI / 2;
    marker.add(ring);
    const upright = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.05, 6, 24), material);
    marker.add(upright);
    marker.visible = false;
    marker.name = 'objective-marker';
    return marker;
  }

  private disposeGroup(group: THREE.Object3D | null): void {
    if (!group) return;
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = (mesh as THREE.Mesh).material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else if (material) material.dispose();
    });
    group.removeFromParent();
  }

  private disposeWorld(): void {
    this.disposeGroup(this.worldGroup);
    this.disposeGroup(this.shardsGroup);
    this.disposeGroup(this.hazardsGroup);
    this.disposeGroup(this.allyGroup);
    this.disposeGroup(this.actorGroup);
    this.disposeGroup(this.nodesGroup);
    this.worldGroup = null;
    this.shardsGroup = null;
    this.hazardsGroup = null;
    this.allyGroup = null;
    this.actorGroup = null;
    this.nodesGroup = null;
    this.shardMeshes.clear();
    this.actorMeshes.clear();
    this.nodeMeshes.length = 0;
    this.hazardMeshes.length = 0;
    this.lights.clear();
    this.marker!.visible = false;
  }

  private applyPalette(chapter: ChapterDef): void {
    this.scene.background = new THREE.Color(chapter.palette.sky);
    this.sky.setPalette(chapter.palette.sky, chapter.palette.fog, chapter.palette.accent);
    const indoor = ['workshop', 'garva-house', 'diviner-room', 'glass-house', 'ledger-room'].includes(
      chapter.location
    );
    this.indoor = indoor;
    this.scene.fog = new THREE.Fog(chapter.palette.fog, indoor ? 24 : 55, indoor ? 100 : 230);
    this.stars.visible = !indoor;
    this.moon.visible = !indoor;

    const hemi = new THREE.HemisphereLight(chapter.palette.fill, 0x1a1c28, indoor ? 1.75 : 2.05);
    this.lights.add(hemi);
    const sun = new THREE.DirectionalLight(chapter.palette.key, indoor ? 2.8 : 3.6);
    sun.position.set(40, 80, 20);
    this.shadowSun = sun;
    this.layoutShadowCamera(sun);
    this.lights.add(sun);

    const accent = new THREE.PointLight(
      chapter.palette.accent,
      chapter.location === 'glass-house' ? 115 : indoor ? 85 : 90,
      indoor ? 95 : 110,
      1.8
    );
    if (chapter.location === 'glass-house') accent.position.set(0, 18, -14);
    else accent.position.set(0, indoor ? 19 : 16, indoor ? 0 : -26);
    this.accentLight = accent;
    this.accentBase = accent.intensity;
    this.lights.add(accent);
    this.applyShadowQuality();
  }

  private layoutShadowCamera(sun: THREE.DirectionalLight): void {
    sun.castShadow = this.quality === 'high';
    sun.shadow.mapSize.set(this.quality === 'high' ? 1024 : 512, this.quality === 'high' ? 1024 : 512);
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 240;
    sun.shadow.bias = -0.0004;
  }

  private applyShadowQuality(): void {
    this.renderer.shadowMap.enabled = this.quality === 'high';
    if (this.shadowSun) this.shadowSun.castShadow = this.quality === 'high';
  }

  private applyQualityVisuals(): void {
    const high = this.quality === 'high';
    // The gradient sky is one cheap draw and carries most of the atmosphere.
    this.sky.mesh.visible = true;
    this.scene.traverse((child) => {
      if ((child as THREE.Sprite).isSprite) child.visible = high;
    });
    this.moon.visible = !this.indoor;
    this.stars.visible = !this.indoor;
    if (this.accentLight) this.accentLight.intensity = high ? this.accentBase : 0;
  }

  setQuality(quality: 'high' | 'low'): void {
    this.quality = quality;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 0.8)
    );
    this.applyQualityVisuals();
    this.applyShadowQuality();
    this.resize();
  }

  get qualityValue(): 'high' | 'low' {
    return this.quality;
  }

  private markActorShadows(root: THREE.Object3D): void {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
  }

  private markWorldShadows(root: THREE.Object3D): void {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.receiveShadow = true;
    });
  }

  loadChapter(chapter: ChapterDef): void {
    this.disposeWorld();
    this.hubMode = false;
    this.applyPalette(chapter);

    const world = buildChapterWorld(chapter);
    this.worldGroup = world;
    this.scene.add(world);

    const shards = new THREE.Group();
    this.shardsGroup = shards;
    this.scene.add(shards);
    for (const shard of chapter.shards ?? []) {
      const mesh = buildShard(shard.motif);
      mesh.position.set(shard.pos.x, shard.pos.y, shard.pos.z);
      shards.add(mesh);
      this.shardMeshes.set(shard.id, mesh);
    }

    const hazards = new THREE.Group();
    this.hazardsGroup = hazards;
    this.scene.add(hazards);
    for (const hazard of chapter.hazards ?? []) {
      let mesh: THREE.Object3D;
      if (hazard.kind === 'swatter') {
        mesh = buildSwatterProp();
      } else if (hazard.kind === 'tweezer') {
        mesh = buildTweezerProp();
      } else if (hazard.kind === 'wind') {
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(
            hazard.radius,
            hazard.radius,
            hazard.height ?? 8,
            14,
            1,
            true
          ),
          new THREE.MeshBasicMaterial({
            color: 0xbfd8ff,
            transparent: true,
            opacity: 0.07,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        mesh = column;
      } else if (hazard.id.includes('search')) {
        const beam = new THREE.Mesh(
          new THREE.ConeGeometry(hazard.radius, 20, 16, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xfff2c8,
            transparent: true,
            opacity: 0.055,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        beam.position.y = -10;
        const group = new THREE.Group();
        group.add(beam);
        mesh = group;
      } else if (hazard.kind === 'smoke') {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(1, hazard.radius * 0.55), 12, 9),
          new THREE.MeshBasicMaterial({
            color: 0x9aa8b8,
            transparent: true,
            opacity: 0.03,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
      } else {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(Math.max(1, hazard.radius * 0.45), 10, 8),
          new THREE.MeshBasicMaterial({
            color: hazard.kind === 'lamp' ? 0xffc060 : 0xff6a3a,
            transparent: true,
            opacity: hazard.kind === 'fire' ? 0.12 : 0.16,
            depthWrite: false
          })
        );
      }
      if (hazard.kind === 'fire' || hazard.kind === 'lamp') {
        mesh.add(
          glowSprite(
            hazard.kind === 'fire' ? 0xff6a2a : 0xffc060,
            Math.max(3, hazard.radius * 1.7),
            hazard.kind === 'fire' ? 0.5 : 0.35
          )
        );
      }
      mesh.position.set(hazard.pos.x, hazard.pos.y, hazard.pos.z);
      hazards.add(mesh);
      this.hazardMeshes.push(mesh);
    }

    if (chapter.ally) {
      const ally = buildShilpi();
      ally.position.set(chapter.ally.pos.x, chapter.ally.pos.y - 9.2, chapter.ally.pos.z);
      ally.rotation.y = 0;
      this.allyGroup = ally;
      this.scene.add(ally);
    }

    if (chapter.actors && chapter.actors.length > 0) {
      const actors = new THREE.Group();
      this.actorGroup = actors;
      this.scene.add(actors);
      for (const actor of chapter.actors) {
        const mesh = buildGarvaCar();
        const start = actor.path[0] ?? { x: 0, y: 0, z: 0 };
        mesh.position.set(start.x, start.y, start.z);
        mesh.rotation.y = Math.PI / 2;
        actors.add(mesh);
        this.actorMeshes.set(actor.id, mesh);
      }
    }

    const nodeObjectives = chapter.objectives.filter(
      (objective) =>
        (objective.kind === 'sabotage' || objective.kind === 'boss') && objective.targets?.length
    );
    if (nodeObjectives.length > 0) {
      const nodes = new THREE.Group();
      this.nodesGroup = nodes;
      this.scene.add(nodes);
      for (const objective of nodeObjectives) {
        objective.targets!.forEach((target, index) => {
          const mesh = buildShard(objective.kind === 'boss' ? 'eye' : 'lamp');
          mesh.position.set(target.x, target.y, target.z);
          mesh.scale.setScalar(1.25);
          nodes.add(mesh);
          this.nodeMeshes.push({ objectiveId: objective.id, index, mesh });
        });
      }
    }

    this.markWorldShadows(world);
    for (const actor of this.actorMeshes.values()) this.markActorShadows(actor);
    if (this.allyGroup) this.markActorShadows(this.allyGroup);
    for (const node of this.nodeMeshes) this.markActorShadows(node.mesh);

    this.applyQualityVisuals();
    this.gali.visible = true;
    this.marker!.visible = false;
  }

  loadHub(): void {
    this.disposeWorld();
    this.hubMode = true;
    this.scene.background = new THREE.Color('#070a14');
    this.scene.fog = new THREE.Fog('#070a14', 40, 160);
    this.stars.visible = true;
    this.moon.visible = true;

    const hemi = new THREE.HemisphereLight(0x9abcf8, 0x2a2030, 1.2);
    this.lights.add(hemi);
    const key = new THREE.DirectionalLight(0xffd9a0, 2.2);
    key.position.set(-20, 40, 20);
    this.lights.add(key);

    this.worldGroup = buildHubWorld();
    this.scene.add(this.worldGroup);
    this.markWorldShadows(this.worldGroup);
    this.gali.visible = true;
    this.gali.position.set(2, 14.5, -1.5);
    this.gali.rotation.set(0, 0.4, 0);
    this.indoor = false;
    this.applyQualityVisuals();
  }

  /** Push sim state into scene objects. Render-only; never writes the sim. */
  sync(source: World | StoryState | null, dt: number): void {
    this.time += dt;

    if (this.hubMode) {
      this.updateHub(dt);
      return;
    }
    if (!source) return;

    const story = isStoryState(source) ? source : null;
    const world: World = story ? story.world : (source as World);
    const p = world.player;
    const boosting = p.speed > world.tuning.player.speed + 0.6;

    this.gali.position.set(p.pos.x, p.pos.y + Math.sin(this.time * 9) * 0.025, p.pos.z);
    this.gali.rotation.set(0, p.yaw, 0);
    this.gali.rotateX(-p.pitch);
    this.gali.rotateZ(p.roll);
    this.gali.visible = p.alive;

    this.blob.position.set(p.pos.x, 0.06, p.pos.z);
    const blobScale = 1 + Math.max(0, p.pos.y - 2) * 0.055;
    this.blob.scale.setScalar(blobScale);
    (this.blob.material as THREE.MeshBasicMaterial).opacity = p.alive ? 0.5 : 0;
    const flap = Math.sin(this.time * 38) * 0.55;
    const wingL = this.gali.getObjectByName('wingL');
    const wingR = this.gali.getObjectByName('wingR');
    const wingLBlur = this.gali.getObjectByName('wingLBlur');
    const wingRBlur = this.gali.getObjectByName('wingRBlur');
    const clipped = story?.wingClipped === true;
    if (wingL) {
      wingL.rotation.z = 0.5 + flap;
      wingL.visible = !clipped;
    }
    if (wingR) {
      wingR.rotation.z = -0.5 - flap;
      wingR.visible = true;
    }
    if (wingLBlur) {
      wingLBlur.rotation.z = 0.62 + flap * 1.15;
      wingLBlur.visible = !clipped;
    }
    if (wingRBlur) {
      wingRBlur.rotation.z = -0.62 - flap * 1.15;
      wingRBlur.visible = true;
    }
    if (clipped) this.gali.rotateZ(-0.18);
    if (p.alive && !this.hubMode) {
      this.particles.trail(
        p.pos.x,
        p.pos.y,
        p.pos.z,
        Math.sin(p.yaw),
        Math.sin(p.pitch),
        Math.cos(p.yaw),
        boosting ? 0xbfe8ff : 0xffd75e,
        boosting ? 2 : 1,
        boosting ? 0.2 : 0.3
      );
    }

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
    for (let i = world.foes.length; i < this.drones.length; i++) this.drones[i].visible = false;

    this.syncStory(story);
    this.syncMarker(story);

    const target = new THREE.Vector3(p.pos.x, p.pos.y, p.pos.z);
    this.chase.update(dt, target, p.yaw, p.pitch, p.roll, boosting, world.solids);
  }

  private syncStory(story: StoryState | null): void {
    if (!story) {
      this.shardMeshes.forEach((mesh) => (mesh.visible = false));
      this.hazardMeshes.forEach((mesh) => (mesh.visible = false));
      this.actorMeshes.forEach((mesh) => (mesh.visible = false));
      this.nodeMeshes.forEach((node) => (node.mesh.visible = false));
      if (this.allyGroup) this.allyGroup.visible = false;
      return;
    }

    let index = 0;
    for (const shard of story.chapter.shards ?? []) {
      const mesh = this.shardMeshes.get(shard.id);
      if (!mesh) continue;
      const found = story.shards[shard.id];
      mesh.visible = !found;
      if (found) continue;
      const bob = Math.sin(this.time * 2.4 + index) * 0.35;
      mesh.position.y = shard.pos.y + bob;
      mesh.rotation.y += 0.02;
      index++;
    }

    for (const actor of story.actors) {
      const mesh = this.actorMeshes.get(actor.id);
      if (!mesh) continue;
      mesh.position.set(actor.x, actor.y, actor.z);
      mesh.visible = true;
    }

    const active = currentObjective(story);
    for (const node of this.nodeMeshes) {
      const visible = active?.id === node.objectiveId && node.index >= story.writeIndex;
      node.mesh.visible = visible;
      if (visible) node.mesh.rotation.y += 0.018;
    }

    for (let i = 0; i < this.hazardMeshes.length; i++) {
      const mesh = this.hazardMeshes[i];
      const runtime = story.hazards[i];
      if (!runtime) continue;
      const hazard = story.chapter.hazards![i];
      mesh.position.set(runtime.x, runtime.y, runtime.z);
      if (hazard.kind === 'fire') {
        mesh.visible = runtime.active;
        if (runtime.active) {
          const pulse = 1 + Math.sin(this.time * 7 + i) * 0.12;
          mesh.scale.setScalar(pulse);
        }
      } else if (hazard.kind === 'smoke') {
        mesh.visible = true;
        mesh.scale.setScalar(1 + Math.sin(this.time * 0.7 + i) * 0.06);
      } else {
        mesh.visible = true;
      }
      if (hazard.kind === 'swatter' || hazard.kind === 'tweezer') {
        mesh.rotation.z = Math.sin(this.time * 2.2 + i) * 0.08;
      }
      if (hazard.kind === 'wind') {
        mesh.rotation.y += 0.004;
      }
    }

    if (this.allyGroup) {
      this.allyGroup.visible = true;
      this.allyGroup.rotation.z = Math.sin(this.time * 0.6) * 0.012;
    }
  }

  private syncMarker(story: StoryState | null): void {
    if (!this.marker) return;
    if (!story || story.phase !== 'playing') {
      this.marker.visible = false;
      return;
    }
    const objective = currentObjective(story);
    if (!objective) {
      this.marker.visible = false;
      return;
    }
    const target = targetPosition(story, objective, story.writeIndex);
    if (!target) {
      this.marker.visible = false;
      return;
    }

    const pulse = 1 + Math.sin(this.time * 3.2) * 0.12;
    this.marker.visible = true;
    this.marker.position.set(target.x, target.y, target.z);
    this.marker.scale.setScalar(pulse);
    this.marker.rotation.y += 0.03;
  }

  private updateHub(dt: number): void {
    const radius = 24;
    const angle = this.time * 0.12;
    const camera = this.chase.camera;
    camera.position.set(Math.cos(angle) * radius, 12 + Math.sin(this.time * 0.2) * 1.5, Math.sin(angle) * radius);
    camera.lookAt(0, 9, -3);
    this.gali.rotation.y = 0.4 + Math.sin(this.time * 0.8) * 0.1;
    this.particles.update(dt);
  }

  burst(x: number, y: number, z: number, big: boolean): void {
    this.particles.burst(x, y, z, big ? 26 : 12, big ? 0xffb060 : 0xffe9a8, big ? 14 : 9, 0.7);
    this.particles.burst(x, y, z, big ? 8 : 4, 0xd05a5a, 6, 1);
  }

  punch(): void {
    if (this.reducedMotion) return;
    this.chase.addShake(0.45);
    this.chase.punchFov();
  }

  look(dx: number, dy: number): void {
    this.chase.addLook(dx, dy);
  }

  zoom(delta: number): void {
    this.chase.addZoom(delta);
  }

  hurtShake(): void {
    if (this.reducedMotion) return;
    this.chase.addShake(0.7);
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  render(dt: number): void {
    if (!this.hubMode) this.particles.update(dt);
    this.sky.update(this.chase.camera);
    this.renderer.render(this.scene, this.chase.camera);
    this.drawCalls = this.renderer.info.render.calls;
  }

  get fpsDrawCalls(): number {
    return this.drawCalls;
  }
}
