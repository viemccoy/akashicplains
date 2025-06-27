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
}

export class EnhancedSemanticGenerator {
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
    console.log(`🌍 Generating semantic chunk at (${chunkX}, ${chunkY})`);
    console.log(`📍 Nearest concepts:`, nearestConcepts.map(c => c.name));
    console.log(`🧭 Player moving:`, playerMovementDirection);
    
    // Find dominant concept for this chunk
    const dominantConcept = this.findDominantConcept(nearestConcepts, chunkX, chunkY);
    const centerConcept = dominantConcept?.name || seedConcept || 'consciousness';
    
    console.log(`🎯 Center concept for chunk: ${centerConcept}`);
    
    try {
      // Generate terrain with enhanced 3D topology
      const result = await this.generateTopologicalTerrain(
        centerConcept,
        chunkX,
        chunkY,
        nearestConcepts,
        playerMovementDirection
      );
      
      console.log(`✅ Generated terrain with ${result.concepts.length} concepts`);
      
      // Convert concepts to influence points for topology
      const influences: ConceptInfluence[] = result.concepts.map((c: any) => ({
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
      
      // Generate elevation map
      const elevationMap = this.topology.generateElevationMap(
        influences,
        chunkX,
        chunkY,
        CHUNK_SIZE
      );
      
      // Convert elevation map to ASCII terrain
      const terrain = this.convertElevationToTerrain(elevationMap);
      
      // Place concept labels
      const labeledTerrain = this.topology.placeConceptLabels(
        terrain,
        influences,
        chunkX,
        chunkY
      );
      
      // Create sacred sites from concepts
      const { sites, concepts } = this.createSitesFromConcepts(
        result.concepts,
        chunkX,
        chunkY,
        elevationMap
      );
      
      const chunk: TerrainChunk = {
        x: chunkX,
        y: chunkY,
        terrain: labeledTerrain,
        energyLevel: 100,
        discoveredAt: Date.now()
      };
      
      return { chunk, sites, newConcepts: concepts };
      
    } catch (error) {
      console.error('❌ Failed to generate semantic chunk:', error);
      return this.generateFallbackChunk(chunkX, chunkY, centerConcept);
    }
  }
  
  private async generateTopologicalTerrain(
    centerConcept: string,
    chunkX: number,
    chunkY: number,
    nearestConcepts: ConceptNode[],
    direction?: string
  ): Promise<any> {
    const prompt = `Generate a topographical semantic map for the concept "${centerConcept}".

CRITICAL: Create elevation patterns where:
1. Semantically similar concepts cluster at similar elevations
2. Abstract concepts appear as peaks (elevation 0.8-1.0)
3. Concrete concepts appear in valleys (elevation 0.0-0.3)
4. Transition zones show gradual elevation changes
5. Every 2-4 tiles should have a related sub-concept or word

The player is moving ${direction || 'exploring freely'}.
Nearby concepts: ${nearestConcepts.slice(0, 3).map(c => c.name).join(', ')}

Include concepts that would naturally appear when exploring "${centerConcept}" in the ${direction || 'current'} direction.

Return JSON with this exact structure:
{
  "concepts": [
    {
      "name": "awareness",
      "x": 5,
      "y": 0,
      "elevation": 0.8,
      "semanticDistance": 0.1,
      "description": "The state of being conscious"
    }
  ],
  "elevationTheme": "Mountains of abstraction surrounding valleys of application"
}

Place 4-8 concepts within the 16x16 chunk at meaningful positions.`;

    console.log(`🤖 Calling Claude API for terrain generation...`);
    
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const content = response.content[0];
    if (content.type === 'text') {
      console.log(`📝 Claude response received, parsing...`);
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✨ Parsed response:`, parsed);
        return parsed;
      }
    }
    
    throw new Error('Failed to parse Claude response');
  }
  
  private convertElevationToTerrain(elevationMap: any[][]): string[] {
    const terrain: string[] = [];
    
    for (let y = 0; y < CHUNK_SIZE; y++) {
      let row = '';
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const elevation = elevationMap[y][x];
        const char = this.topology.elevationToASCII(elevation, x, y, elevationMap);
        row += char;
      }
      terrain.push(row);
    }
    
    return terrain;
  }
  
  private createSitesFromConcepts(
    concepts: any[],
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
        explanation: concept.description || `A ${siteType} of ${concept.name}`,
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
        semanticDistance: concept.semanticDistance
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
    
    // Add a single concept in the center
    const centerX = 8;
    const centerY = 8;
    terrain[centerY] = terrain[centerY].substring(0, centerX - 2) + centerConcept.substring(0, 5).toUpperCase() + terrain[centerY].substring(centerX + 3);
    
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