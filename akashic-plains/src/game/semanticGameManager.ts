import type { GameState, SacredSite, Synthesis, Position } from '../types';
import { EnhancedSemanticGenerator } from '../agents/enhancedSemanticGenerator';
import { SynthesisManager } from './synthesisManager';
import { getChunkKey, getChunkFromGlobal } from '../utils/terrain';
import { TERRAIN_SYMBOLS } from '../types';

interface ConceptNode {
  name: string;
  position: Position;
  elevation: number;
  visited: boolean;
}

export class SemanticGameManager {
  private state: GameState;
  private terrainGenerator: EnhancedSemanticGenerator;
  private synthesisManager: SynthesisManager;
  private loadingChunks: Set<string> = new Set();
  private playerPath: string[] = [];
  private movementDirection: string = 'N';
  private conceptNodes: Map<string, ConceptNode> = new Map();
  private trailIntensity: Map<string, number> = new Map(); // For desire paths
  
  constructor(state: GameState) {
    this.state = state;
    this.terrainGenerator = new EnhancedSemanticGenerator(state.apiKey!);
    this.synthesisManager = new SynthesisManager(state.apiKey!);
    
    // Initialize with seed concept at origin
    if (state.seedConcept) {
      this.conceptNodes.set(state.seedConcept, {
        name: state.seedConcept,
        position: { x: 8, y: 8 },
        elevation: 50,
        visited: false
      });
    }
  }
  
  async movePlayer(dx: number, dy: number): Promise<void> {
    const prevPos = { ...this.state.playerPosition };
    
    // Update player position
    this.state.playerPosition.x += dx;
    this.state.playerPosition.y += dy;
    
    // Track movement direction
    this.movementDirection = this.getDirection(dx, dy);
    this.playerPath.push(this.movementDirection);
    if (this.playerPath.length > 100) {
      this.playerPath.shift();
    }
    
    // Update trail intensity (for desire paths)
    const trailKey = `${prevPos.x},${prevPos.y}-${this.state.playerPosition.x},${this.state.playerPosition.y}`;
    this.trailIntensity.set(trailKey, (this.trailIntensity.get(trailKey) || 0) + 1);
    
    // Check if we've moved to a new chunk
    const { chunkX, chunkY } = getChunkFromGlobal(
      this.state.playerPosition.x,
      this.state.playerPosition.y
    );
    
    const chunkChanged = chunkX !== this.state.currentChunk.x || 
                        chunkY !== this.state.currentChunk.y;
    
    if (chunkChanged) {
      this.state.currentChunk = { x: chunkX, y: chunkY };
      await this.ensureNearbyChunksLoaded();
    }
    
    // Check if player is on a sacred site
    this.checkSacredSiteEncounter();
    
    // Consume energy for movement (less on well-traveled paths)
    const energyCost = this.calculateMovementCost(trailKey);
    this.state.energy = Math.max(0, this.state.energy - energyCost);
  }
  
  async ensureNearbyChunksLoaded(): Promise<void> {
    const { x: cx, y: cy } = this.state.currentChunk;
    const loadDistance = 1;
    
    const promises: Promise<void>[] = [];
    
    for (let dx = -loadDistance; dx <= loadDistance; dx++) {
      for (let dy = -loadDistance; dy <= loadDistance; dy++) {
        const chunkX = cx + dx;
        const chunkY = cy + dy;
        const key = getChunkKey(chunkX, chunkY);
        
        if (!this.state.visitedChunks.has(key) && !this.loadingChunks.has(key)) {
          promises.push(this.loadSemanticChunk(chunkX, chunkY));
        }
      }
    }
    
    await Promise.all(promises);
  }
  
  private async loadSemanticChunk(chunkX: number, chunkY: number): Promise<void> {
    const key = getChunkKey(chunkX, chunkY);
    this.loadingChunks.add(key);
    
    try {
      // Find nearest concept nodes
      const nearestConcepts = this.findNearestConcepts(chunkX, chunkY, 5);
      
      // Generate semantic terrain
      const { chunk, sites, newConcepts } = await this.terrainGenerator.generateSemanticChunk(
        chunkX,
        chunkY,
        nearestConcepts,
        this.movementDirection,
        this.state.seedConcept
      );
      
      // Store the chunk
      this.state.visitedChunks.set(key, chunk);
      
      // Store sacred sites
      for (const site of sites) {
        this.state.discoveredSites.set(site.id, site);
      }
      
      // Add new concept nodes
      for (const concept of newConcepts) {
        if (!this.conceptNodes.has(concept.name)) {
          this.conceptNodes.set(concept.name, concept);
        }
      }
      
      // Apply desire paths if any
      this.applyDesirePaths(chunk, chunkX, chunkY);
      
      // Consume energy for chunk generation
      this.state.energy = Math.max(0, this.state.energy - 3);
      
    } catch (error) {
      console.error(`Failed to load semantic chunk ${key}:`, error);
    } finally {
      this.loadingChunks.delete(key);
    }
  }
  
  private findNearestConcepts(chunkX: number, chunkY: number, count: number): ConceptNode[] {
    const chunkCenterX = chunkX * 16 + 8;
    const chunkCenterY = chunkY * 16 + 8;
    
    const conceptsWithDistance = Array.from(this.conceptNodes.values()).map(concept => {
      const dx = concept.position.x - chunkCenterX;
      const dy = concept.position.y - chunkCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { concept, distance };
    });
    
    return conceptsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(item => item.concept);
  }
  
  private checkSacredSiteEncounter(): void {
    const playerKey = `site_${this.state.playerPosition.x}_${this.state.playerPosition.y}`;
    const site = this.state.discoveredSites.get(playerKey);
    
    if (site) {
      if (site.pilgrims === 0) {
        // First time discovering this site
        site.pilgrims = 1;
        site.firstSeeker = this.state.playerName;
        
        // Mark concept as visited
        const concept = this.conceptNodes.get(site.conceptName);
        if (concept) {
          concept.visited = true;
        }
        
        // Restore energy at sacred sites
        this.state.energy = Math.min(
          this.state.maxEnergy,
          this.state.energy + 15
        );
      } else {
        // Returning to visited site - less energy
        this.state.energy = Math.min(
          this.state.maxEnergy,
          this.state.energy + 5
        );
        site.pilgrims++;
      }
    }
  }
  
  private getDirection(dx: number, dy: number): string {
    if (dx > 0 && dy === 0) return 'E';
    if (dx < 0 && dy === 0) return 'W';
    if (dx === 0 && dy > 0) return 'S';
    if (dx === 0 && dy < 0) return 'N';
    if (dx > 0 && dy < 0) return 'NE';
    if (dx > 0 && dy > 0) return 'SE';
    if (dx < 0 && dy < 0) return 'NW';
    if (dx < 0 && dy > 0) return 'SW';
    return 'N';
  }
  
  private calculateMovementCost(trailKey: string): number {
    const intensity = this.trailIntensity.get(trailKey) || 0;
    
    // Well-traveled paths cost less energy
    if (intensity > 10) return 0.2;
    if (intensity > 5) return 0.3;
    if (intensity > 2) return 0.4;
    return 0.5;
  }
  
  private applyDesirePaths(chunk: any, chunkX: number, chunkY: number) {
    // Check if any high-traffic trails pass through this chunk
    for (const [trail, intensity] of this.trailIntensity.entries()) {
      if (intensity > 5) {
        const [from, to] = trail.split('-').map(pos => {
          const [x, y] = pos.split(',').map(Number);
          return { x, y };
        });
        
        // If trail passes through this chunk, mark it
        if (this.trailPassesThroughChunk(from, to, chunkX, chunkY)) {
          // Add visual indication of desire path
          // This would modify the chunk terrain to show worn paths
        }
      }
    }
  }
  
  private trailPassesThroughChunk(
    from: Position,
    to: Position,
    chunkX: number,
    chunkY: number
  ): boolean {
    const chunkBounds = {
      minX: chunkX * 16,
      maxX: (chunkX + 1) * 16,
      minY: chunkY * 16,
      maxY: (chunkY + 1) * 16
    };
    
    // Simple check if line between from/to intersects chunk
    return (from.x >= chunkBounds.minX && from.x < chunkBounds.maxX &&
            from.y >= chunkBounds.minY && from.y < chunkBounds.maxY) ||
           (to.x >= chunkBounds.minX && to.x < chunkBounds.maxX &&
            to.y >= chunkBounds.minY && to.y < chunkBounds.maxY);
  }
  
  getCurrentLocation(): SacredSite | null {
    const playerKey = `site_${this.state.playerPosition.x}_${this.state.playerPosition.y}`;
    return this.state.discoveredSites.get(playerKey) || null;
  }
  
  getNearbyLocations(radius: number = 5): SacredSite[] {
    const nearby: SacredSite[] = [];
    const { x: px, y: py } = this.state.playerPosition;
    
    for (const site of this.state.discoveredSites.values()) {
      const dx = site.position.x - px;
      const dy = site.position.y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius && distance > 0) {
        nearby.push(site);
      }
    }
    
    return nearby.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.position.x - px, 2) + Math.pow(a.position.y - py, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.position.x - px, 2) + Math.pow(b.position.y - py, 2)
      );
      return distA - distB;
    });
  }
  
  bookmarkSite(site: SacredSite): void {
    if (!this.state.bookmarkedSites.find(s => s.id === site.id)) {
      this.state.bookmarkedSites.push(site);
    }
  }
  
  unbookmarkSite(siteId: string): void {
    this.state.bookmarkedSites = this.state.bookmarkedSites.filter(
      s => s.id !== siteId
    );
  }
  
  canSynthesize(): boolean {
    return this.state.bookmarkedSites.length >= 2 && this.state.energy >= 30;
  }
  
  async performSynthesis(): Promise<Synthesis | null> {
    if (!this.canSynthesize()) return null;
    
    try {
      const synthesis = await this.synthesisManager.performSynthesis(
        this.state.bookmarkedSites,
        this.playerPath.join(''),
        this.state.playerPosition
      );
      
      // Clear bookmarks
      this.state.bookmarkedSites = [];
      
      // Consume energy
      this.state.energy = Math.max(0, this.state.energy - 30);
      
      // Add synthesis as a new concept node
      const synthesisConcept: ConceptNode = {
        name: synthesis.name,
        position: synthesis.position,
        elevation: 75, // Synthesized concepts are elevated
        visited: true
      };
      
      this.conceptNodes.set(synthesis.name, synthesisConcept);
      
      // Create sacred site for the synthesis
      const crystalSite: SacredSite = {
        id: synthesis.id,
        position: synthesis.position,
        glyph: TERRAIN_SYMBOLS.CRYSTALS,
        conceptName: synthesis.name,
        siteType: 'crystals',
        explanation: synthesis.revelation,
        wisdomDensity: 1.0,
        pilgrims: 0,
        leyLines: synthesis.sourceGlyphs.map(g => `source_${g}`)
      };
      
      this.state.discoveredSites.set(crystalSite.id, crystalSite);
      
      return synthesis;
    } catch (error) {
      console.error('Synthesis failed:', error);
      return null;
    }
  }
  
  getState(): GameState {
    return this.state;
  }
  
  getConceptMap(): Map<string, ConceptNode> {
    return this.conceptNodes;
  }
  
  getTrailIntensity(): Map<string, number> {
    return this.trailIntensity;
  }
  
  getTerrainInfo(): { symbol: string, elevation: number, concept?: string } | null {
    const { x, y } = this.state.playerPosition;
    const { chunkX, chunkY } = getChunkFromGlobal(x, y);
    const chunk = this.state.visitedChunks.get(getChunkKey(chunkX, chunkY));
    
    if (!chunk) return null;
    
    const localX = x % 16;
    const localY = y % 16;
    const symbol = chunk.terrain[localY]?.[localX] || '·';
    
    // Find dominant concept for this position
    let nearestConcept: string | undefined;
    let minDistance = Infinity;
    
    for (const [name, node] of this.conceptNodes) {
      const dist = Math.sqrt(
        Math.pow(node.position.x - x, 2) + 
        Math.pow(node.position.y - y, 2)
      );
      if (dist < minDistance && dist < 10) {
        minDistance = dist;
        nearestConcept = name;
      }
    }
    
    // Estimate elevation from symbol
    const elevationMap: Record<string, number> = {
      '·': 0.1,
      '░': 0.2,
      '▒': 0.4,
      '▓': 0.6,
      '█': 0.8,
      '▀': 1.0,
      '◉': 0.9,
      '●': 0.8,
      '◐': 0.7
    };
    
    return {
      symbol,
      elevation: elevationMap[symbol] || 0.5,
      concept: nearestConcept
    };
  }
}