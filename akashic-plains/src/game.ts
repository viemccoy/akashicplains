import type { GameState, TerrainChunk } from './types';
import { generateEmptyChunk, getChunkKey } from './utils/terrain';
import { GameManager } from './game/gameManager';

export function initializeGame(apiKey: string): GameState {
  const initialChunk: TerrainChunk = {
    x: 0,
    y: 0,
    terrain: generateEmptyChunk(),
    energyLevel: 100,
    discoveredAt: Date.now(),
  };
  
  const visitedChunks = new Map<string, TerrainChunk>();
  visitedChunks.set(getChunkKey(0, 0), initialChunk);
  
  return {
    playerPosition: { x: 8, y: 8 }, // Start in center of initial chunk
    currentChunk: { x: 0, y: 0 },
    visitedChunks,
    discoveredSites: new Map(),
    bookmarkedSites: [],
    energy: 100,
    maxEnergy: 100,
    apiKey,
    playerName: 'Wanderer',
  };
}

export { GameManager };