import * as THREE from 'three';

export interface Sky {
  mesh: THREE.Mesh;
  setPalette(sky: string, fog: string, accent: string): void;
  update(camera: THREE.Camera): void;
}

/** One-draw-call gradient dome with a soft sun/moon glow. */
export function createSky(): Sky {
  const uniforms = {
    topColor: { value: new THREE.Color('#0d1530') },
    bottomColor: { value: new THREE.Color('#111a38') },
    sunColor: { value: new THREE.Color('#e8b04b') },
    sunDir: { value: new THREE.Vector3(-0.4, 0.35, -0.85).normalize() }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(bottomColor, topColor, pow(h, 0.72));
        float glow = pow(max(dot(dir, normalize(sunDir)), 0.0), 90.0);
        float haze = pow(max(dot(dir, normalize(sunDir)), 0.0), 8.0) * 0.12;
        col += sunColor * (glow * 0.85 + haze);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  return {
    mesh,
    setPalette(sky, fog, accent) {
      uniforms.topColor.value.set(sky);
      uniforms.bottomColor.value.set(fog);
      uniforms.sunColor.value.set(accent);
    },
    update(camera) {
      mesh.position.copy(camera.position);
    }
  };
}
