import type { TerrainChunk, SacredSite, Position } from '../types';
import { CHUNK_SIZE, TERRAIN_SYMBOLS } from '../types';
import { ClaudeClient } from './claudeClient';
import { SemanticEngine } from './semanticEngine';
import type { SemanticAnalysis } from './semanticEngine';
import { setTerrainAt } from '../utils/terrain';

interface ConceptNode {
  name: string;
  position: Position;
  elevation: number;
  visited: boolean;
}

export class SemanticTerrainGenerator {
  private claude: ClaudeClient;
  private engine: SemanticEngine;
  private conceptMap: Map<string, ConceptNode> = new Map();
  
  constructor(apiKey: string) {
    this.claude = new ClaudeClient(apiKey);
    this.engine = new SemanticEngine(apiKey);
  }
  
  async generateSemanticChunk(
    chunkX: number,
    chunkY: number,
    nearestConcepts: ConceptNode[],
    playerMovementDirection?: string
  ): Promise<{
    chunk: TerrainChunk,
    sites: SacredSite[],
    newConcepts: ConceptNode[]
  }> {
    console.log(`Generating semantic chunk at (${chunkX}, ${chunkY})`);
    
    // Analyze nearest concepts to determine what should generate here
    const dominantConcept = this.findDominantConcept(nearestConcepts, chunkX, chunkY);
    
    if (!dominantConcept) {
      // Far from any concepts - generate sparse desert
      return this.generateSparseDesert(chunkX, chunkY);
    }
    
    // Analyze the dominant concept
    const analysis = await this.engine.analyzeConcept(dominantConcept.name);
    
    // Generate terrain based on semantic topology
    const terrain = this.generateTerrainFromTopology(
      analysis.topology,
      analysis.dimensions.abstractionLevel,
      analysis.dimensions.complexity
    );
    
    // Place semantic neighbors as sacred sites
    const { sites, concepts } = await this.placeSemanticNeighbors(
      analysis.neighbors,
      dominantConcept,
      chunkX,
      chunkY,
      playerMovementDirection
    );
    
    // Add elevation variations
    this.applyElevationGradient(terrain, analysis.topology.elevation);
    
    // Add ley lines between related concepts
    this.addSemanticLeyLines(terrain, sites, analysis.dimensions.domains);
    
    const chunk: TerrainChunk = {
      x: chunkX,
      y: chunkY,
      terrain,
      energyLevel: 100,
      discoveredAt: Date.now()
    };
    
    return { chunk, sites, newConcepts: concepts };
  }
  
  private findDominantConcept(
    nearestConcepts: ConceptNode[],
    chunkX: number,
    chunkY: number
  ): ConceptNode | null {
    if (nearestConcepts.length === 0) return null;
    
    // Find the concept that most influences this chunk
    let closest = nearestConcepts[0];
    let minDistance = Infinity;
    
    for (const concept of nearestConcepts) {
      const dx = (chunkX * CHUNK_SIZE + 8) - concept.position.x;
      const dy = (chunkY * CHUNK_SIZE + 8) - concept.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = concept;
      }
    }
    
    // If too far from any concept, return null
    return minDistance < 50 ? closest : null;
  }
  
  private generateTerrainFromTopology(
    topology: any,
    abstractionLevel: number,
    complexity: number
  ): string[] {
    const terrain: string[] = [];
    
    for (let y = 0; y < CHUNK_SIZE; y++) {
      let row = '';
      for (let x = 0; x < CHUNK_SIZE; x++) {
        row += this.getTerrainSymbol(x, y, topology, abstractionLevel, complexity);
      }
      terrain.push(row);
    }
    
    return terrain;
  }
  
  private getTerrainSymbol(
    x: number,
    y: number,
    topology: any,
    abstractionLevel: number,
    complexity: number
  ): string {
    const noise = Math.random();
    
    switch (topology.terrainType) {
      case 'mountains':
        // High abstraction = peaks
        if (noise < abstractionLevel * 0.3) return TERRAIN_SYMBOLS.PYRAMID;
        if (noise < 0.5) return TERRAIN_SYMBOLS.DUNES;
        return TERRAIN_SYMBOLS.SAND;
        
      case 'valleys':
        // Confluence points
        if (noise < topology.density * 0.4) return TERRAIN_SYMBOLS.OASIS;
        return TERRAIN_SYMBOLS.PLAINS;
        
      case 'forests':
        // Dense information
        if (noise < complexity * 0.3) return TERRAIN_SYMBOLS.GLYPHS;
        if (noise < topology.density * 0.5) return TERRAIN_SYMBOLS.DUNES;
        return TERRAIN_SYMBOLS.PLAINS;
        
      case 'bridges':
        // Connection points
        if ((x === 7 || x === 8) && noise < 0.8) return TERRAIN_SYMBOLS.LEY_LINE;
        return TERRAIN_SYMBOLS.PLAINS;
        
      case 'cliffs':
        // Abstraction jumps
        if (y < 8 && noise < 0.3) return TERRAIN_SYMBOLS.PYRAMID;
        if (y >= 8 && noise < 0.3) return TERRAIN_SYMBOLS.PLAINS;
        return TERRAIN_SYMBOLS.SAND;
        
      case 'oasis':
        // Knowledge springs
        const centerDist = Math.sqrt(Math.pow(x - 8, 2) + Math.pow(y - 8, 2));
        if (centerDist < 4 && noise < 0.6) return TERRAIN_SYMBOLS.OASIS;
        if (centerDist < 6 && noise < 0.4) return TERRAIN_SYMBOLS.PLAINS;
        return TERRAIN_SYMBOLS.SAND;
        
      default:
        // Plains
        if (noise < topology.density * 0.1) return TERRAIN_SYMBOLS.DUNES;
        if (noise < 0.05) return TERRAIN_SYMBOLS.CRYSTALS;
        return TERRAIN_SYMBOLS.PLAINS;
    }
  }
  
  private async placeSemanticNeighbors(
    neighbors: any[],
    centerConcept: ConceptNode,
    chunkX: number,
    chunkY: number,
    playerDirection?: string
  ): Promise<{ sites: SacredSite[], concepts: ConceptNode[] }> {
    const sites: SacredSite[] = [];
    const concepts: ConceptNode[] = [];
    
    // Filter neighbors based on player movement direction
    const relevantNeighbors = playerDirection 
      ? this.filterNeighborsByDirection(neighbors, playerDirection)
      : neighbors.slice(0, 5);
    
    for (const neighbor of relevantNeighbors) {
      // Calculate position based on semantic distance and direction
      const position = this.calculateSemanticPosition(
        centerConcept.position,
        neighbor.distance,
        neighbor.direction
      );
      
      // Check if this position is in our chunk
      if (this.isPositionInChunk(position, chunkX, chunkY)) {
        const localX = position.x % CHUNK_SIZE;
        const localY = position.y % CHUNK_SIZE;
        
        const site: SacredSite = {
          id: `site_${position.x}_${position.y}`,
          position,
          glyph: this.getGlyphForRelationship(neighbor.relationshipType),
          conceptName: neighbor.concept,
          siteType: this.getSiteTypeForRelationship(neighbor.relationshipType),
          explanation: `Connected to ${centerConcept.name} through ${neighbor.relationshipType}`,
          wisdomDensity: neighbor.strength,
          pilgrims: 0,
          leyLines: [centerConcept.name]
        };
        
        sites.push(site);
        
        // Add to concept map
        const conceptNode: ConceptNode = {
          name: neighbor.concept,
          position,
          elevation: this.calculateElevation(neighbor, centerConcept),
          visited: false
        };
        
        concepts.push(conceptNode);
        this.conceptMap.set(neighbor.concept, conceptNode);
      }
    }
    
    return { sites, concepts };
  }
  
  private filterNeighborsByDirection(
    neighbors: any[],
    playerDirection: string
  ): any[] {
    // Prioritize concepts in the direction player is moving
    const directionMap: Record<string, string[]> = {
      'N': ['N', 'NE', 'NW'],
      'S': ['S', 'SE', 'SW'],
      'E': ['E', 'NE', 'SE'],
      'W': ['W', 'NW', 'SW'],
      'NE': ['NE', 'N', 'E'],
      'SE': ['SE', 'S', 'E'],
      'SW': ['SW', 'S', 'W'],
      'NW': ['NW', 'N', 'W']
    };
    
    const preferredDirs = directionMap[playerDirection] || ['N', 'S', 'E', 'W'];
    
    return neighbors
      .filter(n => preferredDirs.includes(n.direction))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
  }
  
  private calculateSemanticPosition(
    center: Position,
    distance: number,
    direction: string
  ): Position {
    // Convert semantic distance to tile distance (roughly 1 semantic unit = 0.5 tiles)
    const tileDistance = Math.round(distance * 0.5);
    
    const directionVectors: Record<string, [number, number]> = {
      'N': [0, -1],
      'S': [0, 1],
      'E': [1, 0],
      'W': [-1, 0],
      'NE': [1, -1],
      'SE': [1, 1],
      'SW': [-1, 1],
      'NW': [-1, -1]
    };
    
    const [dx, dy] = directionVectors[direction] || [0, 0];
    
    return {
      x: center.x + (dx * tileDistance),
      y: center.y + (dy * tileDistance)
    };
  }
  
  private isPositionInChunk(position: Position, chunkX: number, chunkY: number): boolean {
    const chunkStartX = chunkX * CHUNK_SIZE;
    const chunkStartY = chunkY * CHUNK_SIZE;
    
    return position.x >= chunkStartX && 
           position.x < chunkStartX + CHUNK_SIZE &&
           position.y >= chunkStartY && 
           position.y < chunkStartY + CHUNK_SIZE;
  }
  
  private getGlyphForRelationship(type: string): string {
    const glyphMap: Record<string, string> = {
      'prerequisite': '◆',
      'application': '◊',
      'parallel': '═',
      'emergence': '※',
      'subset': '◈',
      'generalization': '▲'
    };
    
    return glyphMap[type] || TERRAIN_SYMBOLS.GLYPHS;
  }
  
  private getSiteTypeForRelationship(type: string): 'temple' | 'pyramid' | 'oasis' | 'crystals' | 'obelisk' {
    const typeMap: Record<string, any> = {
      'prerequisite': 'obelisk',
      'application': 'crystals',
      'parallel': 'oasis',
      'emergence': 'temple',
      'subset': 'crystals',
      'generalization': 'pyramid'
    };
    
    return typeMap[type] || 'obelisk';
  }
  
  private calculateElevation(
    neighbor: any,
    centerConcept: ConceptNode
  ): number {
    // Higher abstraction = higher elevation
    if (neighbor.relationshipType === 'generalization') {
      return centerConcept.elevation + 20;
    } else if (neighbor.relationshipType === 'application') {
      return centerConcept.elevation - 20;
    }
    
    return centerConcept.elevation + (Math.random() * 10 - 5);
  }
  
  private applyElevationGradient(terrain: string[], baseElevation: number) {
    // Add visual hints of elevation through terrain density
    if (baseElevation > 70) {
      // High elevation - add more pyramids
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * CHUNK_SIZE);
        const y = Math.floor(Math.random() * CHUNK_SIZE);
        terrain[y] = setTerrainAt(terrain, x, y, TERRAIN_SYMBOLS.PYRAMID)[y];
      }
    } else if (baseElevation < 30) {
      // Low elevation - add more oases
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * CHUNK_SIZE);
        const y = Math.floor(Math.random() * CHUNK_SIZE);
        terrain[y] = setTerrainAt(terrain, x, y, TERRAIN_SYMBOLS.OASIS)[y];
      }
    }
  }
  
  private addSemanticLeyLines(
    terrain: string[],
    sites: SacredSite[],
    domains: string[]
  ) {
    // Connect sites that share domains
    for (let i = 0; i < sites.length - 1; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const site1 = sites[i];
        const site2 = sites[j];
        
        // Simple line drawing between related concepts
        const x1 = site1.position.x % CHUNK_SIZE;
        const y1 = site1.position.y % CHUNK_SIZE;
        const x2 = site2.position.x % CHUNK_SIZE;
        const y2 = site2.position.y % CHUNK_SIZE;
        
        // Only connect if both are in this chunk and related
        if (Math.random() < 0.3) {
          this.drawLeyLine(terrain, x1, y1, x2, y2);
        }
      }
    }
  }
  
  private drawLeyLine(terrain: string[], x1: number, y1: number, x2: number, y2: number) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      
      if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_SIZE) {
        const current = terrain[y][x];
        // Don't overwrite important features
        if (current === TERRAIN_SYMBOLS.SAND || current === TERRAIN_SYMBOLS.PLAINS) {
          terrain[y] = setTerrainAt(terrain, x, y, TERRAIN_SYMBOLS.LEY_LINE)[y];
        }
      }
    }
  }
  
  private generateSparseDesert(
    chunkX: number,
    chunkY: number
  ): { chunk: TerrainChunk, sites: SacredSite[], newConcepts: ConceptNode[] } {
    const terrain: string[] = [];
    
    // Mostly empty desert with occasional features
    for (let y = 0; y < CHUNK_SIZE; y++) {
      let row = '';
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const noise = Math.random();
        if (noise < 0.02) row += TERRAIN_SYMBOLS.DUNES;
        else if (noise < 0.01) row += TERRAIN_SYMBOLS.CRYSTALS;
        else row += TERRAIN_SYMBOLS.SAND;
      }
      terrain.push(row);
    }
    
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