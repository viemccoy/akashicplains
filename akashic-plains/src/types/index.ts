export interface Position {
  x: number;
  y: number;
}

export interface TerrainChunk {
  x: number;
  y: number;
  terrain: string[]; // 16x16 grid of ASCII characters
  energyLevel: number;
  discoveredAt: number;
}

export interface SacredSite {
  id: string;
  position: Position;
  glyph: string;
  conceptName: string;
  siteType: 'temple' | 'pyramid' | 'oasis' | 'crystals' | 'obelisk';
  explanation?: string;
  wisdomDensity: number;
  pilgrims: number;
  firstSeeker?: string;
  leyLines: string[];
}

export interface LeyLine {
  from: Position;
  to: Position;
  energyType: 'logical' | 'mystical' | 'harmonic';
}

export interface WandererTrail {
  wandererId: string;
  position: Position;
  timestamp: number;
}

export interface Synthesis {
  id: string;
  name: string;
  sourceGlyphs: string[];
  revelation: string;
  oracleId: string;
  position: Position;
  crystallizedAt: number;
}

export interface GameState {
  playerPosition: Position;
  currentChunk: Position;
  visitedChunks: Map<string, TerrainChunk>;
  discoveredSites: Map<string, SacredSite>;
  bookmarkedSites: SacredSite[];
  energy: number;
  maxEnergy: number;
  apiKey: string | null;
  playerName: string;
  seedConcept?: string;
}

export interface TerrainGenerationResult {
  terrain: string[];
  sacred_sites: Array<{
    x: number;
    y: number;
    glyph: string;
    whispered_name: string;
    site_type: string;
  }>;
  ley_lines: Array<{
    from: [number, number];
    to: [number, number];
    energy_type: string;
  }>;
}

export interface OracleRevelation {
  revelation: string;
  ley_connections: Array<{
    site: string;
    flow: string;
    resonance: number;
  }>;
  hidden_truth: string;
  riddle: string;
}

export interface SynthesisCrystallization {
  name: string;
  description: string;
  powers: string[];
  manifestLocation: Position;
  prophecy: string;
}

export const TERRAIN_SYMBOLS = {
  SAND: '░',
  PLAINS: '.',
  DUNES: '∩',
  PYRAMID: '▲',
  OBELISK: '╫',
  OASIS: '≈',
  TEMPLE_TOP: '┌─┐',
  TEMPLE_MID: '│ │',
  TEMPLE_BOT: '└─┘',
  CRYSTALS: '◆',
  GLYPHS: '※',
  LEY_LINE: '═',
  SANDSTORM: '▓',
  PLAYER: '@',
  WANDERER: '☺',
} as const;

export const CHUNK_SIZE = 16;
export const VIEW_DISTANCE = 20; // How many tiles to show around player