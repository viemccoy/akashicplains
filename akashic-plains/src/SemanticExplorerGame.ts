import { EnhancedSemanticEngine } from './engine/EnhancedSemanticEngine';
import { TerrainRenderer } from './engine/TerrainRenderer';
import './style.css';
import './semantic-explorer.css';

export class SemanticExplorerGame {
  private engine: EnhancedSemanticEngine;
  private renderer: TerrainRenderer;
  private playerPos = { x: 32, y: 32 }; // Start at center of 64x64 world
  private playerId: string;
  private playerName: string;
  private currentConcept: any = null;
  private currentSynthesis: any = null;
  
  constructor(apiKey: string, playerName: string) {
    this.engine = new EnhancedSemanticEngine(apiKey);
    this.renderer = new TerrainRenderer();
    this.playerId = `player-${Date.now()}`;
    this.playerName = playerName;
    
    this.setupEventHandlers();
  }
  
  async initialize(seedWord: string) {
    console.log(`🚀 Initializing semantic world with: ${seedWord}`);
    await this.engine.initializeWithSeed(seedWord);
    this.render();
  }
  
  private setupEventHandlers() {
    document.addEventListener('keydown', async (e) => {
      let dx = 0, dy = 0;
      let handled = true;
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          dy = -1;
          break;
        case 's':
        case 'arrowdown':
          dy = 1;
          break;
        case 'a':
        case 'arrowleft':
          dx = -1;
          break;
        case 'd':
        case 'arrowright':
          dx = 1;
          break;
        case 'b':
          // Bookmark current concept
          if (this.currentConcept) {
            const bookmarked = this.engine.bookmarkConcept(this.currentConcept.id);
            console.log(`${bookmarked ? 'Bookmarked' : 'Unbookmarked'}: ${this.currentConcept.word}`);
            this.render();
          }
          break;
        default:
          handled = false;
      }
      
      if (handled) {
        e.preventDefault();
      }
      
      if (dx !== 0 || dy !== 0) {
        await this.movePlayer(dx, dy);
      }
    });
  }
  
  private async movePlayer(dx: number, dy: number) {
    const newX = this.playerPos.x + dx;
    const newY = this.playerPos.y + dy;
    
    // Boundary check
    if (newX < 0 || newX >= 64 || newY < 0 || newY >= 64) return;
    
    this.playerPos.x = newX;
    this.playerPos.y = newY;
    
    // Explore the new tile
    const concept = await this.engine.exploreTile(newX, newY, this.playerId);
    if (concept) {
      console.log(`Discovered: ${concept.word}`);
    }
    
    this.render();
  }
  
  private render() {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    
    // Get terrain view
    const { tiles, concepts, syntheses } = this.engine.getTerrainView(
      this.playerPos.x,
      this.playerPos.y
    );
    
    // Check what's at current position
    this.currentConcept = concepts.find(c => 
      c.position.x === this.playerPos.x && c.position.y === this.playerPos.y
    );
    this.currentSynthesis = syntheses.find(s =>
      s.position.x === this.playerPos.x && s.position.y === this.playerPos.y
    );
    
    // Render terrain
    const terrainLines = this.renderer.renderTerrain(
      tiles,
      concepts,
      syntheses,
      this.playerPos.x,
      this.playerPos.y,
      [] // Other players would go here in multiplayer
    );
    
    // Get bookmarks
    const bookmarks = this.engine.getBookmarkedConcepts();
    
    app.innerHTML = `
      <div class="semantic-explorer">
        <div class="explorer-header">
          <h1>◉ AKASHIC PLAINS ◉</h1>
          <div class="player-info">
            ${this.playerName} | Position: (${this.playerPos.x}, ${this.playerPos.y}) | 
            Bookmarks: ${bookmarks.length}
          </div>
        </div>
        
        <div class="explorer-main">
          <div class="terrain-container">
            <pre class="terrain-display">${terrainLines.join('\n')}</pre>
            <div class="fog-overlay"></div>
          </div>
          
          <div class="info-panel">
            <div class="current-info">
              ${this.renderer.renderConceptInfo(this.currentConcept, this.currentSynthesis)}
            </div>
            
            <div class="bookmarks-section">
              <h3>◈ BOOKMARKED CONCEPTS</h3>
              ${this.renderer.renderBookmarks(bookmarks)}
            </div>
            
            <div class="nearby-section">
              <h3>⟐ NEARBY CONCEPTS</h3>
              ${this.renderNearbyConcepts(concepts)}
            </div>
          </div>
        </div>
        
        <div class="explorer-footer">
          <div class="controls">
            WASD/↑↓←→: Move | B: Bookmark | Space: Interact
          </div>
          <div class="discovery-count">
            Discovered: ${concepts.filter(c => c.discovered).length} concepts
          </div>
        </div>
      </div>
    `;
    
    // Setup synthesis button handler
    const synthButton = document.getElementById('create-synthesis');
    if (synthButton) {
      synthButton.addEventListener('click', async () => {
        await this.createSynthesis();
      });
    }
  }
  
  private renderNearbyConcepts(concepts: any[]): string {
    const nearby = concepts
      .filter(c => {
        const dx = c.position.x - this.playerPos.x;
        const dy = c.position.y - this.playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 0 && dist < 8 && c.discovered;
      })
      .sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a.position.x - this.playerPos.x, 2) +
          Math.pow(a.position.y - this.playerPos.y, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b.position.x - this.playerPos.x, 2) +
          Math.pow(b.position.y - this.playerPos.y, 2)
        );
        return distA - distB;
      })
      .slice(0, 5);
    
    if (nearby.length === 0) {
      return '<div class="no-nearby">Explore to discover nearby concepts...</div>';
    }
    
    return `
      <div class="nearby-list">
        ${nearby.map(concept => {
          const dx = concept.position.x - this.playerPos.x;
          const dy = concept.position.y - this.playerPos.y;
          const direction = this.getDirection(dx, dy);
          const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
          
          return `
            <div class="nearby-item">
              <span class="nearby-direction">${direction}</span>
              <span class="nearby-word">${concept.word}</span>
              <span class="nearby-distance">${distance}m</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  private getDirection(dx: number, dy: number): string {
    const angle = Math.atan2(dy, dx);
    const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
    const directions = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
    return directions[octant];
  }
  
  private async createSynthesis() {
    const bookmarks = this.engine.getBookmarkedConcepts();
    if (bookmarks.length < 2) return;
    
    const button = document.getElementById('create-synthesis') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = '✧ CRYSTALLIZING... ✧';
    }
    
    const synthesis = await this.engine.createSynthesis(
      bookmarks.map(b => b.word),
      this.playerId,
      this.playerPos
    );
    
    if (synthesis) {
      console.log(`✨ Created synthesis: ${synthesis.name}`);
      
      // Clear bookmarks after synthesis
      bookmarks.forEach(b => this.engine.bookmarkConcept(b.id));
    }
    
    this.render();
  }
}