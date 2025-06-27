import type { TerrainChunk, SacredSite } from '../types';
import { CHUNK_SIZE, TERRAIN_SYMBOLS } from '../types';
import { ClaudeClient } from './claudeClient';
import { generateEmptyChunk, setTerrainAt } from '../utils/terrain';

export class TerrainGenerator {
  private claude: ClaudeClient;
  
  constructor(apiKey: string) {
    this.claude = new ClaudeClient(apiKey);
  }
  
  async generateChunk(
    chunkX: number,
    chunkY: number,
    centerConcept: string = 'consciousness',
    adjacentChunks?: Map<string, TerrainChunk>
  ): Promise<{
    chunk: TerrainChunk,
    sites: SacredSite[]
  }> {
    try {
      // Get adjacent terrain info
      const adjacentInfo = this.getAdjacentTerrainInfo(chunkX, chunkY, adjacentChunks || new Map());
      const direction = this.getDirectionFromCenter(chunkX, chunkY);
      
      // Generate terrain using Claude
      const result = await this.claude.generateTerrain(
        centerConcept,
        adjacentInfo,
        direction
      );
      
      // Process the generated terrain
      const terrain = this.processGeneratedTerrain(result.terrain);
      
      // Create sacred sites
      const sites = await this.createSacredSites(
        result.sacred_sites,
        chunkX,
        chunkY,
        centerConcept
      );
      
      // Apply ley lines
      if (result.ley_lines) {
        this.applyLeyLines(terrain, result.ley_lines);
      }
      
      const chunk: TerrainChunk = {
        x: chunkX,
        y: chunkY,
        terrain,
        energyLevel: 100,
        discoveredAt: Date.now()
      };
      
      return { chunk, sites };
      
    } catch (error) {
      console.error('Failed to generate chunk with Claude:', error);
      // Fallback to procedural generation
      return this.generateProceduralChunk(chunkX, chunkY);
    }
  }
  
  private processGeneratedTerrain(generatedTerrain: string[]): string[] {
    // Ensure we have exactly 16 rows of 16 characters each
    const terrain: string[] = [];
    
    for (let y = 0; y < CHUNK_SIZE; y++) {
      if (generatedTerrain[y]) {
        // Ensure each row is exactly 16 characters
        let row = generatedTerrain[y].substring(0, CHUNK_SIZE);
        if (row.length < CHUNK_SIZE) {
          row = row.padEnd(CHUNK_SIZE, TERRAIN_SYMBOLS.SAND);
        }
        terrain.push(row);
      } else {
        // Fill missing rows with sand
        terrain.push(TERRAIN_SYMBOLS.SAND.repeat(CHUNK_SIZE));
      }
    }
    
    return terrain;
  }
  
  private async createSacredSites(
    siteData: any[],
    chunkX: number,
    chunkY: number,
    centerConcept: string
  ): Promise<SacredSite[]> {
    const sites: SacredSite[] = [];
    
    for (const site of siteData) {
      const globalX = chunkX * CHUNK_SIZE + site.x;
      const globalY = chunkY * CHUNK_SIZE + site.y;
      
      const sacredSite: SacredSite = {
        id: `site_${globalX}_${globalY}`,
        position: { x: globalX, y: globalY },
        glyph: site.glyph || TERRAIN_SYMBOLS.GLYPHS,
        conceptName: site.whispered_name || centerConcept,
        siteType: site.site_type || 'obelisk',
        wisdomDensity: Math.random() * 0.5 + 0.5,
        pilgrims: 0,
        leyLines: []
      };
      
      sites.push(sacredSite);
    }
    
    return sites;
  }
  
  private applyLeyLines(terrain: string[], leyLines: any[]) {
    for (const line of leyLines) {
      const [x1, y1] = line.from;
      const [x2, y2] = line.to;
      
      // Simple line drawing between points
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const x = Math.round(x1 + (x2 - x1) * t);
        const y = Math.round(y1 + (y2 - y1) * t);
        
        if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_SIZE) {
          // Don't overwrite sacred sites
          const current = terrain[y][x];
          if (current === TERRAIN_SYMBOLS.SAND || current === TERRAIN_SYMBOLS.PLAINS) {
            terrain[y] = terrain[y].substring(0, x) + TERRAIN_SYMBOLS.LEY_LINE + terrain[y].substring(x + 1);
          }
        }
      }
    }
  }
  
  private getAdjacentTerrainInfo(
    chunkX: number,
    chunkY: number,
    adjacentChunks?: Map<string, TerrainChunk>
  ): string {
    if (!adjacentChunks || adjacentChunks.size === 0) {
      return 'virgin sands, untouched by consciousness';
    }
    
    const patterns: string[] = [];
    const dirs = [
      { dx: 0, dy: -1, name: 'north' },
      { dx: 1, dy: 0, name: 'east' },
      { dx: 0, dy: 1, name: 'south' },
      { dx: -1, dy: 0, name: 'west' }
    ];
    
    for (const dir of dirs) {
      const key = `${chunkX + dir.dx},${chunkY + dir.dy}`;
      const chunk = adjacentChunks.get(key);
      if (chunk) {
        // Analyze edge of adjacent chunk
        const edgePattern = this.analyzeChunkEdge(chunk, dir.name);
        patterns.push(`${dir.name}: ${edgePattern}`);
      }
    }
    
    return patterns.length > 0 ? patterns.join(', ') : 'surrounded by unexplored mysteries';
  }
  
  private analyzeChunkEdge(chunk: TerrainChunk, direction: string): string {
    // Analyze the edge of the chunk facing us
    let edgeChars = '';
    
    switch (direction) {
      case 'north':
        edgeChars = chunk.terrain[CHUNK_SIZE - 1];
        break;
      case 'south':
        edgeChars = chunk.terrain[0];
        break;
      case 'east':
        for (let y = 0; y < CHUNK_SIZE; y++) {
          edgeChars += chunk.terrain[y][0];
        }
        break;
      case 'west':
        for (let y = 0; y < CHUNK_SIZE; y++) {
          edgeChars += chunk.terrain[y][CHUNK_SIZE - 1];
        }
        break;
    }
    
    // Count terrain types
    const counts = new Map<string, number>();
    for (const char of edgeChars) {
      counts.set(char, (counts.get(char) || 0) + 1);
    }
    
    // Describe the edge
    const dominant = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    switch (dominant) {
      case TERRAIN_SYMBOLS.SAND:
        return 'shifting sands';
      case TERRAIN_SYMBOLS.DUNES:
        return 'rolling dunes';
      case TERRAIN_SYMBOLS.OASIS:
        return 'fertile waters';
      case TERRAIN_SYMBOLS.PYRAMID:
        return 'ancient monuments';
      default:
        return 'mysterious patterns';
    }
  }
  
  private getDirectionFromCenter(chunkX: number, chunkY: number): string {
    if (chunkX === 0 && chunkY === 0) return 'center';
    
    const angle = Math.atan2(chunkY, chunkX) * 180 / Math.PI;
    
    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'northeast';
    if (angle >= 67.5 && angle < 112.5) return 'north';
    if (angle >= 112.5 && angle < 157.5) return 'northwest';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'southwest';
    if (angle >= -112.5 && angle < -67.5) return 'south';
    return 'southeast';
  }
  
  // Fallback procedural generation
  private generateProceduralChunk(
    chunkX: number,
    chunkY: number
  ): { chunk: TerrainChunk, sites: SacredSite[] } {
    const terrain = generateEmptyChunk();
    const sites: SacredSite[] = [];
    
    // Add some random terrain features
    const features = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < features; i++) {
      const x = Math.floor(Math.random() * CHUNK_SIZE);
      const y = Math.floor(Math.random() * CHUNK_SIZE);
      const feature = Math.random();
      
      if (feature < 0.3) {
        // Dunes
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE) {
              terrain[ny] = setTerrainAt(terrain, nx, ny, TERRAIN_SYMBOLS.DUNES)[ny];
            }
          }
        }
      } else if (feature < 0.5) {
        // Plains
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE) {
              terrain[ny] = setTerrainAt(terrain, nx, ny, TERRAIN_SYMBOLS.PLAINS)[ny];
            }
          }
        }
      } else if (feature < 0.7) {
        // Oasis
        terrain[y] = setTerrainAt(terrain, x, y, TERRAIN_SYMBOLS.OASIS)[y];
        // Add surrounding water
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE && Math.random() > 0.3) {
              terrain[ny] = setTerrainAt(terrain, nx, ny, TERRAIN_SYMBOLS.OASIS)[ny];
            }
          }
        }
      } else if (feature < 0.9) {
        // Sacred site
        const glyph = Math.random() > 0.5 ? TERRAIN_SYMBOLS.GLYPHS : TERRAIN_SYMBOLS.CRYSTALS;
        terrain[y] = setTerrainAt(terrain, x, y, glyph)[y];
        
        const globalX = chunkX * CHUNK_SIZE + x;
        const globalY = chunkY * CHUNK_SIZE + y;
        
        sites.push({
          id: `site_${globalX}_${globalY}`,
          position: { x: globalX, y: globalY },
          glyph,
          conceptName: this.generateConceptName(),
          siteType: glyph === TERRAIN_SYMBOLS.GLYPHS ? 'obelisk' : 'crystals',
          wisdomDensity: Math.random() * 0.5 + 0.5,
          pilgrims: 0,
          leyLines: []
        });
      } else {
        // Pyramid
        terrain[y] = setTerrainAt(terrain, x, y, TERRAIN_SYMBOLS.PYRAMID)[y];
      }
    }
    
    const chunk: TerrainChunk = {
      x: chunkX,
      y: chunkY,
      terrain,
      energyLevel: 100,
      discoveredAt: Date.now()
    };
    
    return { chunk, sites };
  }
  
  private generateConceptName(): string {
    const concepts = [
      'Emergence', 'Recursion', 'Entropy', 'Synthesis', 'Resonance',
      'Transcendence', 'Iteration', 'Convergence', 'Paradox', 'Infinity',
      'Consciousness', 'Pattern', 'Chaos', 'Order', 'Balance',
      'Flow', 'Void', 'Unity', 'Duality', 'Transformation'
    ];
    
    const modifiers = [
      'Ancient', 'Hidden', 'Eternal', 'Shifting', 'Crystalline',
      'Quantum', 'Fractal', 'Luminous', 'Forgotten', 'Awakened'
    ];
    
    const useModifier = Math.random() > 0.5;
    const concept = concepts[Math.floor(Math.random() * concepts.length)];
    
    if (useModifier) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      return `${modifier} ${concept}`;
    }
    
    return concept;
  }
}