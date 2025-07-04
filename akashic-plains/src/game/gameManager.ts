import type { GameState, SacredSite, Synthesis } from '../types';
import { TerrainGenerator } from '../agents/terrainGenerator';
import { SynthesisManager } from './synthesisManager';
import { getChunkKey, getChunkFromGlobal } from '../utils/terrain';
import { TERRAIN_SYMBOLS } from '../types';

export class GameManager {
  private state: GameState;
  private terrainGenerator: TerrainGenerator;
  private synthesisManager: SynthesisManager;
  private loadingChunks: Set<string> = new Set();
  private playerPath: string[] = [];
  
  constructor(state: GameState) {
    this.state = state;
    this.terrainGenerator = new TerrainGenerator(state.apiKey!);
    this.synthesisManager = new SynthesisManager(state.apiKey!);
  }
  
  async movePlayer(dx: number, dy: number): Promise<void> {
    // Update player position
    this.state.playerPosition.x += dx;
    this.state.playerPosition.y += dy;
    
    // Track player path for synthesis
    const direction = dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N';
    this.playerPath.push(direction);
    if (this.playerPath.length > 100) {
      this.playerPath.shift();
    }
    
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
    
    // Consume energy for movement
    this.state.energy = Math.max(0, this.state.energy - 0.5);
  }
  
  async ensureNearbyChunksLoaded(): Promise<void> {
    const { x: cx, y: cy } = this.state.currentChunk;
    const loadDistance = 1; // Load chunks 1 unit away
    
    const promises: Promise<void>[] = [];
    
    for (let dx = -loadDistance; dx <= loadDistance; dx++) {
      for (let dy = -loadDistance; dy <= loadDistance; dy++) {
        const chunkX = cx + dx;
        const chunkY = cy + dy;
        const key = getChunkKey(chunkX, chunkY);
        
        if (!this.state.visitedChunks.has(key) && !this.loadingChunks.has(key)) {
          promises.push(this.loadChunk(chunkX, chunkY));
        }
      }
    }
    
    await Promise.all(promises);
  }
  
  private async loadChunk(chunkX: number, chunkY: number): Promise<void> {
    const key = getChunkKey(chunkX, chunkY);
    
    // Mark as loading to prevent duplicate requests
    this.loadingChunks.add(key);
    
    try {
      // Determine the center concept based on distance from origin
      const distance = Math.sqrt(chunkX * chunkX + chunkY * chunkY);
      const centerConcept = this.getConceptForDistance(distance);
      
      // Generate the chunk
      const { chunk, sites } = await this.terrainGenerator.generateChunk(
        chunkX,
        chunkY,
        centerConcept,
        this.state.visitedChunks
      );
      
      // Store the chunk
      this.state.visitedChunks.set(key, chunk);
      
      // Store sacred sites
      for (const site of sites) {
        this.state.discoveredSites.set(site.id, site);
      }
      
      // Consume energy for chunk generation
      this.state.energy = Math.max(0, this.state.energy - 5);
      
    } catch (error) {
      console.error(`Failed to load chunk ${key}:`, error);
    } finally {
      this.loadingChunks.delete(key);
    }
  }
  
  private getConceptForDistance(distance: number): string {
    // Use seed concept at origin, then get more abstract as you move away
    if (distance < 1) {
      return this.state.seedConcept || 'consciousness';
    }
    
    // Concepts get more abstract/complex as you move away from origin
    const concepts = [
      ['consciousness', 'awareness', 'being'],
      ['thought', 'mind', 'cognition'],
      ['knowledge', 'wisdom', 'understanding'],
      ['time', 'space', 'dimension'],
      ['quantum', 'probability', 'uncertainty'],
      ['infinity', 'paradox', 'void'],
      ['transcendence', 'enlightenment', 'unity']
    ];
    
    const tier = Math.min(Math.floor(distance / 3), concepts.length - 1);
    const tierConcepts = concepts[tier];
    return tierConcepts[Math.floor(Math.random() * tierConcepts.length)];
  }
  
  private checkSacredSiteEncounter(): void {
    const playerKey = `site_${this.state.playerPosition.x}_${this.state.playerPosition.y}`;
    const site = this.state.discoveredSites.get(playerKey);
    
    if (site && site.pilgrims === 0) {
      // First time discovering this site
      site.pilgrims = 1;
      site.firstSeeker = this.state.playerName;
      
      // Restore some energy at sacred sites
      this.state.energy = Math.min(
        this.state.maxEnergy,
        this.state.energy + 10
      );
    }
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
      // Perform the synthesis
      const synthesis = await this.synthesisManager.performSynthesis(
        this.state.bookmarkedSites,
        this.playerPath.join(''),
        this.state.playerPosition
      );
      
      // Clear bookmarks
      this.state.bookmarkedSites = [];
      
      // Consume energy
      this.state.energy = Math.max(0, this.state.energy - 30);
      
      // Add crystal to the map
      const { chunkX, chunkY } = getChunkFromGlobal(
        synthesis.position.x,
        synthesis.position.y
      );
      const chunkKey = getChunkKey(chunkX, chunkY);
      const chunk = this.state.visitedChunks.get(chunkKey);
      
      if (chunk) {
        // Add crystal to terrain
        const localX = synthesis.position.x % 16;
        const localY = synthesis.position.y % 16;
        const row = chunk.terrain[localY];
        chunk.terrain[localY] = row.substring(0, localX) + TERRAIN_SYMBOLS.CRYSTALS + row.substring(localX + 1);
      }
      
      // Create a sacred site for the crystal
      const crystalSite: SacredSite = {
        id: synthesis.id,
        position: synthesis.position,
        glyph: TERRAIN_SYMBOLS.CRYSTALS,
        conceptName: synthesis.name,
        siteType: 'crystals',
        explanation: synthesis.revelation,
        wisdomDensity: 1.0,
        pilgrims: 0,
        leyLines: []
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
}