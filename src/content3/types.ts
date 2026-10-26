export interface LocalizedText {
  en: string;
  te: string;
}

export interface Vec3Data {
  x: number;
  y: number;
  z: number;
}

export type ObjectiveKind =
  | 'reach'
  | 'collect'
  | 'survive'
  | 'write'
  | 'destroy'
  | 'escort'
  | 'boss';

export interface ObjectiveDef {
  id: string;
  kind: ObjectiveKind;
  label: LocalizedText;
  hint?: LocalizedText;
  target?: Vec3Data;
  radius?: number;
  shardIds?: string[];
  seconds?: number;
  count?: number;
  marks?: Vec3Data[];
  bossId?: string;
  escortId?: string;
}

export type ShardMotif =
  | 'hand'
  | 'locket'
  | 'phone'
  | 'car'
  | 'needle'
  | 'lamp'
  | 'wing'
  | 'eye';

export interface ShardDef {
  id: string;
  pos: Vec3Data;
  caption: LocalizedText;
  motif: ShardMotif;
}

export interface WaveDef {
  atSeconds: number;
  count: number;
  kind?: 'drone';
  pos?: Vec3Data;
}

export type HazardKind = 'wind' | 'swatter' | 'tweezer' | 'lamp' | 'fire' | 'smoke';

export interface HazardDef {
  id: string;
  kind: HazardKind;
  pos: Vec3Data;
  radius: number;
  height?: number;
  strength?: number;
  periodSeconds?: number;
  activeSeconds?: number;
  path?: Vec3Data[];
  dir?: Vec3Data;
}

export interface CardDef {
  id: string;
  at: 'intro' | 'mid' | 'outro';
  title?: LocalizedText;
  body: LocalizedText;
}

export interface AllyDef {
  id: 'shilpi';
  pos: Vec3Data;
  scale: number;
}

export interface ChapterTuningDef {
  speed?: number;
  boost?: number;
  yawRate?: number;
  pitchLimit?: number;
  minAltitude?: number;
  maxAltitude?: number;
  arenaRadius?: number;
  lives?: number;
  invulnFrames?: number;
}

export interface PaletteDef {
  fog: string;
  sky: string;
  key: string;
  fill: string;
  accent: string;
}

export type LocationId =
  | 'hub'
  | 'lane'
  | 'balcony'
  | 'workshop'
  | 'airport-road'
  | 'garva-house'
  | 'ledger-room'
  | 'diviner-room'
  | 'glass-house';

export interface ChapterDef {
  id: string;
  order: number;
  enabled: boolean;
  title: LocalizedText;
  subtitle: LocalizedText;
  location: LocationId;
  palette: PaletteDef;
  bounds: { radius: number; minY: number; maxY: number };
  spawn: { pos: Vec3Data; yaw: number };
  layout: 'city' | 'none';
  layoutSeed?: number;
  solids?: { x: number; z: number; r: number; h: number; w: number; d: number; rot: number; colorIdx: number }[];
  tuning?: ChapterTuningDef;
  objectives: ObjectiveDef[];
  waves?: WaveDef[];
  shards?: ShardDef[];
  hazards?: HazardDef[];
  ally?: AllyDef;
  cards: CardDef[];
  unlock: string[];
}
