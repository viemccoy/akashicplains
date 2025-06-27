import { TERRAIN_SYMBOLS, CHUNK_SIZE } from '../types';

export function generateEmptyChunk(): string[] {
  return Array(CHUNK_SIZE).fill(null).map(() => 
    TERRAIN_SYMBOLS.SAND.repeat(CHUNK_SIZE)
  );
}

export function getChunkKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseChunkKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function globalToLocal(globalX: number, globalY: number, chunkX: number, chunkY: number) {
  const localX = globalX - (chunkX * CHUNK_SIZE);
  const localY = globalY - (chunkY * CHUNK_SIZE);
  return { localX, localY };
}

export function localToGlobal(localX: number, localY: number, chunkX: number, chunkY: number) {
  const globalX = localX + (chunkX * CHUNK_SIZE);
  const globalY = localY + (chunkY * CHUNK_SIZE);
  return { globalX, globalY };
}

export function getChunkFromGlobal(globalX: number, globalY: number) {
  const chunkX = Math.floor(globalX / CHUNK_SIZE);
  const chunkY = Math.floor(globalY / CHUNK_SIZE);
  return { chunkX, chunkY };
}

export function setTerrainAt(terrain: string[], x: number, y: number, symbol: string): string[] {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE) return terrain;
  
  const newTerrain = [...terrain];
  const row = terrain[y];
  newTerrain[y] = row.substring(0, x) + symbol + row.substring(x + 1);
  return newTerrain;
}

export function getTerrainAt(terrain: string[], x: number, y: number): string {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE) return TERRAIN_SYMBOLS.SAND;
  return terrain[y][x];
}

export function renderTerrainAroundPlayer(
  chunks: Map<string, { terrain: string[] }>,
  playerGlobalX: number,
  playerGlobalY: number,
  viewDistance: number,
  sacredSites?: Map<string, any>
): string[] {
  const lines: string[] = [];
  
  for (let dy = -viewDistance; dy <= viewDistance; dy++) {
    let line = '';
    for (let dx = -viewDistance; dx <= viewDistance; dx++) {
      const globalX = playerGlobalX + dx;
      const globalY = playerGlobalY + dy;
      
      const { chunkX, chunkY } = getChunkFromGlobal(globalX, globalY);
      const { localX, localY } = globalToLocal(globalX, globalY, chunkX, chunkY);
      
      const chunk = chunks.get(getChunkKey(chunkX, chunkY));
      
      if (dx === 0 && dy === 0) {
        line += TERRAIN_SYMBOLS.PLAYER;
      } else if (sacredSites?.has(`site_${globalX}_${globalY}`)) {
        // Show sacred site glyph
        const site = sacredSites.get(`site_${globalX}_${globalY}`);
        line += site.glyph || TERRAIN_SYMBOLS.GLYPHS;
      } else if (chunk) {
        line += getTerrainAt(chunk.terrain, localX, localY);
      } else {
        line += TERRAIN_SYMBOLS.SAND;
      }
    }
    lines.push(line);
  }
  
  return lines;
}