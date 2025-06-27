import type { TerrainChunk, SacredSite, Position } from '../types';
import { CHUNK_SIZE } from '../types';
import { SemanticEngine } from './semanticEngine';
import { TopologyGenerator } from './topologyGenerator';
import type { ConceptInfluence } from './topologyGenerator';
import Anthropic from '@anthropic-ai/sdk';

interface ConceptNode {
  name: string;
  position: Position;
  elevation: number;
  visited: boolean;
  semanticDistance?: number;
  explanation?: string;
  fact?: string;
}

interface TerrainConcept {
  name: string;
  x: number;
  y: number;
  elevation: number;
  semanticDistance: number;
  description: string;
  fact: string;
  density: 'sparse' | 'normal' | 'dense';
}

export class IdealSemanticGenerator {
  private engine: SemanticEngine;
  private topology: TopologyGenerator;
  private client: Anthropic;
  private conceptMap: Map<string, ConceptNode> = new Map();
  
  constructor(apiKey: string) {
    this.engine = new SemanticEngine(apiKey);
    this.topology = new TopologyGenerator();
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  
  async generateSemanticChunk(
    chunkX: number,
    chunkY: number,
    nearestConcepts: ConceptNode[],
    playerMovementDirection?: string,
    seedConcept?: string
  ): Promise<{
    chunk: TerrainChunk,
    sites: SacredSite[],
    newConcepts: ConceptNode[]
  }> {
    console.log(`🌍 Generating ideal semantic chunk at (${chunkX}, ${chunkY})`);
    
    // Find dominant concept for this chunk
    const dominantConcept = this.findDominantConcept(nearestConcepts, chunkX, chunkY);
    const centerConcept = dominantConcept?.name || seedConcept || 'consciousness';
    
    try {
      // Generate terrain with organic concept density
      const result = await this.generateOrganicTerrain(
        centerConcept,
        chunkX,
        chunkY,
        nearestConcepts,
        playerMovementDirection
      );
      
      // Convert concepts to influence points for topology
      const influences: ConceptInfluence[] = result.concepts.map((c: TerrainConcept) => ({
        name: c.name,
        position: { 
          x: chunkX * CHUNK_SIZE + c.x, 
          y: chunkY * CHUNK_SIZE + c.y 
        },
        elevation: c.elevation,
        semanticDistance: c.semanticDistance
      }));
      
      // Add existing concepts as influences
      for (const existing of nearestConcepts) {
        influences.push({
          name: existing.name,
          position: existing.position,
          elevation: existing.elevation,
          semanticDistance: existing.semanticDistance || 0.5
        });
      }
      
      // Generate elevation map with proper transitions
      const elevationMap = this.topology.generateElevationMap(
        influences,
        chunkX,
        chunkY,
        CHUNK_SIZE
      );
      
      // Convert elevation map to ASCII terrain with visual semantic topology
      const terrain = this.convertToSemanticTerrain(elevationMap, result.concepts, chunkX, chunkY);
      
      // Apply trail visualization for heavily traveled paths
      const terrainWithTrails = this.applyTrailVisualization(terrain, chunkX, chunkY);
      
      // Create sacred sites and concept nodes
      const { sites, concepts } = this.createEnhancedSites(
        result.concepts,
        chunkX,
        chunkY,
        elevationMap
      );
      
      const chunk: TerrainChunk = {
        x: chunkX,
        y: chunkY,
        terrain: terrainWithTrails,
        energyLevel: 100,
        discoveredAt: Date.now()
      };
      
      return { chunk, sites, newConcepts: concepts };
      
    } catch (error) {
      console.error('❌ Failed to generate ideal semantic chunk:', error);
      return this.generateFallbackChunk(chunkX, chunkY, centerConcept);
    }
  }
  
  private async generateOrganicTerrain(
    centerConcept: string,
    chunkX: number,
    chunkY: number,
    nearestConcepts: ConceptNode[],
    direction?: string
  ): Promise<{ concepts: TerrainConcept[], topology: string }> {
    const prompt = `Generate an organic semantic terrain map for "${centerConcept}".

CRITICAL REQUIREMENTS for Ideal Akashic Plains Experience:

1. ORGANIC CONCEPT DENSITY:
   - Create natural clusters of related concepts (3-5 concepts close together)
   - Leave sparse areas between clusters (representing semantic distance)
   - Denser areas = richer semantic fields, sparser = transitional zones
   
2. VISUAL SEMANTIC TOPOLOGY:
   - Abstract concepts at HIGH elevation (0.8-1.0) = mountain peaks
   - Concrete examples at LOW elevation (0.0-0.3) = valleys
   - Related concepts cluster at SIMILAR elevations
   - Create ridges connecting abstract ideas
   - Form valleys for practical applications

3. MOVEMENT CONTEXT:
   Player is moving ${direction || 'exploring'} from "${centerConcept}"
   Nearby: ${nearestConcepts.slice(0, 3).map(c => c.name).join(', ')}
   
4. EACH CONCEPT NEEDS:
   - A brief explanation (what it means in relation to ${centerConcept})
   - A fascinating fact or insight (very concise)
   - Appropriate elevation based on abstraction level
   - Density indicator for cluster/sparse placement

Return JSON:
{
  "concepts": [
    {
      "name": "neural networks",
      "x": 3,
      "y": 2,
      "elevation": 0.3,
      "semanticDistance": 0.2,
      "description": "Computational models inspired by brain structure",
      "fact": "Can dream and hallucinate like biological minds",
      "density": "dense"
    }
  ],
  "topology": "Description of the overall semantic landscape created"
}

Place 5-12 concepts organically - some clustered, some isolated.`;

    console.log(`🤖 Calling Claude Haiku for organic terrain generation...`);
    
    const response = await this.client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 2048,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✨ Generated ${parsed.concepts.length} concepts organically`);
        return parsed;
      }
    }
    
    throw new Error('Failed to parse Claude response');
  }
  
  private convertToSemanticTerrain(
    elevationMap: any[][],
    concepts: TerrainConcept[],
    chunkX: number,
    chunkY: number
  ): string[] {
    const terrain: string[] = [];
    
    // Create concept position map for efficient lookup
    const conceptMap = new Map<string, TerrainConcept>();
    for (const concept of concepts) {
      conceptMap.set(`${concept.x},${concept.y}`, concept);
    }
    
    for (let y = 0; y < CHUNK_SIZE; y++) {
      let row = '';
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const elevation = elevationMap[y][x];
        
        // Check if there's a concept at this position
        const concept = conceptMap.get(`${x},${y}`);
        if (concept && concept.name.length <= 8) {
          // Place concept name directly in terrain
          const name = concept.name.toUpperCase();
          row += name;
          x += name.length - 1; // Skip ahead
        } else {
          // Generate appropriate terrain based on elevation and transitions
          const char = this.getSemanticTerrainChar(elevation, x, y, elevationMap);
          row += char;
        }
      }
      
      // Ensure row is exactly CHUNK_SIZE characters
      if (row.length < CHUNK_SIZE) {
        row += '.'.repeat(CHUNK_SIZE - row.length);
      } else if (row.length > CHUNK_SIZE) {
        row = row.substring(0, CHUNK_SIZE);
      }
      
      terrain.push(row);
    }
    
    return terrain;
  }
  
  private getSemanticTerrainChar(
    elevation: any,
    x: number,
    y: number,
    elevationMap: any[][]
  ): string {
    const height = elevation.height;
    
    // Check for directional transitions
    const neighbors = {
      n: elevationMap[y-1]?.[x]?.height || height,
      s: elevationMap[y+1]?.[x]?.height || height,
      e: elevationMap[y]?.[x+1]?.height || height,
      w: elevationMap[y]?.[x-1]?.height || height
    };
    
    // Calculate slope
    const vertSlope = neighbors.s - neighbors.n;
    const horizSlope = neighbors.e - neighbors.w;
    const maxSlope = Math.max(Math.abs(vertSlope), Math.abs(horizSlope));
    
    // Directional shading for slopes
    if (maxSlope > 0.2) {
      if (Math.abs(vertSlope) > Math.abs(horizSlope)) {
        return vertSlope > 0 ? '╱' : '╲';
      } else {
        return horizSlope > 0 ? '═' : '─';
      }
    }
    
    // Elevation-based characters
    if (height > 0.9) return '▀'; // Peak
    if (height > 0.8) return '█'; // Mountain
    if (height > 0.6) return '▓'; // Hill
    if (height > 0.4) return '▒'; // Rise
    if (height > 0.2) return '░'; // Plain
    if (height > 0.1) return '·'; // Valley
    return '·'; // Deep valley
  }
  
  private applyTrailVisualization(terrain: string[], chunkX: number, chunkY: number): string[] {
    // Apply trail visualization for heavily traveled paths
    const modifiedTerrain = [...terrain];
    
    // Get trail data from game context (would be passed in real implementation)
    const trailData = (window as any).gameTrailData;
    if (!trailData) return modifiedTerrain;
    
    for (const [trail, intensity] of trailData.entries()) {
      if (intensity > 5) { // Only show well-worn paths
        const [from, to] = trail.split('-').map((pos: string) => {
          const [x, y] = pos.split(',').map(Number);
          return { x, y };
        });
        
        // Check if trail passes through this chunk
        const chunkBounds = {
          minX: chunkX * CHUNK_SIZE,
          maxX: (chunkX + 1) * CHUNK_SIZE,
          minY: chunkY * CHUNK_SIZE,
          maxY: (chunkY + 1) * CHUNK_SIZE
        };
        
        // Simple line interpolation for trail
        const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = Math.round(from.x + (to.x - from.x) * t);
          const y = Math.round(from.y + (to.y - from.y) * t);
          
          if (x >= chunkBounds.minX && x < chunkBounds.maxX &&
              y >= chunkBounds.minY && y < chunkBounds.maxY) {
            const localX = x - chunkBounds.minX;
            const localY = y - chunkBounds.minY;
            
            if (localY >= 0 && localY < CHUNK_SIZE && localX >= 0 && localX < CHUNK_SIZE) {
              // Apply worn path character based on intensity
              const row = modifiedTerrain[localY];
              if (row) {
                const chars = row.split('');
                if (intensity > 10) {
                  chars[localX] = '═'; // Very worn path
                } else {
                  chars[localX] = '─'; // Moderately worn path
                }
                modifiedTerrain[localY] = chars.join('');
              }
            }
          }
        }
      }
    }
    
    return modifiedTerrain;
  }
  
  private createEnhancedSites(
    concepts: TerrainConcept[],
    chunkX: number,
    chunkY: number,
    elevationMap: any[][]
  ): { sites: SacredSite[], concepts: ConceptNode[] } {
    const sites: SacredSite[] = [];
    const conceptNodes: ConceptNode[] = [];
    
    for (const concept of concepts) {
      const globalX = chunkX * CHUNK_SIZE + concept.x;
      const globalY = chunkY * CHUNK_SIZE + concept.y;
      
      // Determine site type based on elevation
      const elevation = elevationMap[concept.y]?.[concept.x]?.height || concept.elevation;
      const siteType = this.getSiteTypeFromElevation(elevation);
      const glyph = this.getGlyphFromElevation(elevation);
      
      const site: SacredSite = {
        id: `site_${globalX}_${globalY}`,
        position: { x: globalX, y: globalY },
        glyph,
        conceptName: concept.name,
        siteType,
        explanation: concept.description,
        wisdomDensity: elevation,
        pilgrims: 0,
        leyLines: []
      };
      
      sites.push(site);
      
      const node: ConceptNode = {
        name: concept.name,
        position: { x: globalX, y: globalY },
        elevation: concept.elevation,
        visited: false,
        semanticDistance: concept.semanticDistance,
        explanation: concept.description,
        fact: concept.fact
      };
      
      conceptNodes.push(node);
      this.conceptMap.set(concept.name, node);
    }
    
    return { sites, concepts: conceptNodes };
  }
  
  private getSiteTypeFromElevation(elevation: number): 'temple' | 'pyramid' | 'oasis' | 'crystals' | 'obelisk' {
    if (elevation > 0.8) return 'pyramid';
    if (elevation > 0.6) return 'temple';
    if (elevation > 0.4) return 'obelisk';
    if (elevation > 0.2) return 'crystals';
    return 'oasis';
  }
  
  private getGlyphFromElevation(elevation: number): string {
    if (elevation > 0.8) return '▲';
    if (elevation > 0.6) return '■';
    if (elevation > 0.4) return '◆';
    if (elevation > 0.2) return '◊';
    return '≈';
  }
  
  private findDominantConcept(
    concepts: ConceptNode[],
    chunkX: number,
    chunkY: number
  ): ConceptNode | null {
    if (concepts.length === 0) return null;
    
    const chunkCenterX = chunkX * CHUNK_SIZE + 8;
    const chunkCenterY = chunkY * CHUNK_SIZE + 8;
    
    let closest = concepts[0];
    let minDistance = Infinity;
    
    for (const concept of concepts) {
      const dx = chunkCenterX - concept.position.x;
      const dy = chunkCenterY - concept.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = concept;
      }
    }
    
    return minDistance < 50 ? closest : null;
  }
  
  private generateFallbackChunk(
    chunkX: number,
    chunkY: number,
    centerConcept: string
  ): { chunk: TerrainChunk, sites: SacredSite[], newConcepts: ConceptNode[] } {
    console.log(`⚠️ Using fallback generation for chunk (${chunkX}, ${chunkY})`);
    
    const terrain: string[] = [];
    for (let y = 0; y < CHUNK_SIZE; y++) {
      let row = '';
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const noise = Math.random();
        if (noise < 0.1) row += '░';
        else if (noise < 0.2) row += '·';
        else row += '·';
      }
      terrain.push(row);
    }
    
    // Add center concept
    const centerY = 8;
    const name = centerConcept.substring(0, 8).toUpperCase();
    terrain[centerY] = terrain[centerY].substring(0, 4) + name + terrain[centerY].substring(4 + name.length);
    
    const chunk: TerrainChunk = {
      x: chunkX,
      y: chunkY,
      terrain,
      energyLevel: 100,
      discoveredAt: Date.now()
    };
    
    return { chunk, sites: [], newConcepts: [] };
  }
  
  getConceptMap(): Map<string, ConceptNode> {
    return this.conceptMap;
  }
}