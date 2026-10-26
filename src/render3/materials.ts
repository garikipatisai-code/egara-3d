import * as THREE from 'three';
import { texture, type TextureKind } from './textures';

export interface TexturedOptions {
  repeatX?: number;
  repeatY?: number;
  roughness?: number;
  metalness?: number;
  size?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

/** Cheap lit material with a procedural map; tinted by the material colour. */
export function textured(
  kind: TextureKind,
  color: number,
  options: TexturedOptions = {}
): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color,
    map: texture(kind, options.repeatX ?? 1, options.repeatY ?? 1, options.size ?? 256),
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1
  });
}

/** Window grid: map + emissive map so lit panes glow at night. */
export function windowMaterial(color = 0x9a8a70): THREE.MeshLambertMaterial {
  const map = texture('window', 1, 1, 256);
  return new THREE.MeshLambertMaterial({
    color,
    map,
    emissive: new THREE.Color(0xffb060),
    emissiveMap: map,
    emissiveIntensity: 0.7
  });
}

export function emissive(color: number, intensity = 1.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0.1
  });
}
