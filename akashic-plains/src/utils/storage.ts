import type { GameState, TerrainChunk, SacredSite } from '../types';

export class StorageManager {
  private readonly STORAGE_KEY = 'akashic_plains_save';
  private readonly CHUNK_PREFIX = 'akashic_chunk_';
  
  saveGameState(state: GameState): void {
    const saveData = {
      playerPosition: state.playerPosition,
      currentChunk: state.currentChunk,
      energy: state.energy,
      maxEnergy: state.maxEnergy,
      playerName: state.playerName,
      bookmarkedSites: state.bookmarkedSites,
      // Don't save API key for security
      // Don't save full chunks/sites - too large
      visitedChunkKeys: Array.from(state.visitedChunks.keys()),
      discoveredSiteIds: Array.from(state.discoveredSites.keys()),
      lastSaved: Date.now()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
    
    // Save chunks separately to avoid size limits
    state.visitedChunks.forEach((chunk, key) => {
      this.saveChunk(key, chunk);
    });
    
    // Save sites separately
    state.discoveredSites.forEach((site, id) => {
      this.saveSite(id, site);
    });
  }
  
  loadGameState(apiKey: string): GameState | null {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (!savedData) return null;
    
    try {
      const data = JSON.parse(savedData);
      
      // Check if save is too old (more than 7 days)
      if (Date.now() - data.lastSaved > 7 * 24 * 60 * 60 * 1000) {
        this.clearSave();
        return null;
      }
      
      // Reconstruct game state
      const visitedChunks = new Map<string, TerrainChunk>();
      data.visitedChunkKeys.forEach((key: string) => {
        const chunk = this.loadChunk(key);
        if (chunk) {
          visitedChunks.set(key, chunk);
        }
      });
      
      const discoveredSites = new Map<string, SacredSite>();
      data.discoveredSiteIds.forEach((id: string) => {
        const site = this.loadSite(id);
        if (site) {
          discoveredSites.set(id, site);
        }
      });
      
      return {
        playerPosition: data.playerPosition,
        currentChunk: data.currentChunk,
        visitedChunks,
        discoveredSites,
        bookmarkedSites: data.bookmarkedSites || [],
        energy: data.energy,
        maxEnergy: data.maxEnergy,
        apiKey,
        playerName: data.playerName
      };
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }
  
  private saveChunk(key: string, chunk: TerrainChunk): void {
    localStorage.setItem(
      `${this.CHUNK_PREFIX}${key}`,
      JSON.stringify(chunk)
    );
  }
  
  private loadChunk(key: string): TerrainChunk | null {
    const data = localStorage.getItem(`${this.CHUNK_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  }
  
  private saveSite(id: string, site: SacredSite): void {
    localStorage.setItem(
      `akashic_site_${id}`,
      JSON.stringify(site)
    );
  }
  
  private loadSite(id: string): SacredSite | null {
    const data = localStorage.getItem(`akashic_site_${id}`);
    return data ? JSON.parse(data) : null;
  }
  
  clearSave(): void {
    // Remove main save
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Remove all chunks and sites
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('akashic_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  hasSave(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}