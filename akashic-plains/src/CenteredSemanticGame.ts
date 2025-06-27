import { RichSemanticEngine, type GlobalSynthesis } from './engine/RichSemanticEngine';
import { TerrainRenderer } from './engine/TerrainRenderer';
import { MultiplayerClient, type PlayerState } from './multiplayer/MultiplayerClient';
import { GlobalDiscoveryFeed } from './components/GlobalDiscoveryFeed';
import './style.css';
import './ui/CenteredUI.css';

export class CenteredSemanticGame {
  private engine: RichSemanticEngine;
  private renderer: TerrainRenderer;
  private multiplayer?: MultiplayerClient;
  private discoveryFeed: GlobalDiscoveryFeed;
  private playerPos = { x: 128, y: 128 }; // Start at center of larger world
  private playerId: string;
  private playerName: string;
  private currentConcept: any = null;
  private currentSynthesis: any = null;
  private discoveries = 0;
  private totalConcepts = 0;
  private otherPlayers: PlayerState[] = [];
  private multiplayerEnabled = false;
  private isEditingName = false;
  
  constructor(apiKey: string, playerName: string) {
    this.engine = new RichSemanticEngine(apiKey);
    this.renderer = new TerrainRenderer();
    this.discoveryFeed = new GlobalDiscoveryFeed();
    this.playerId = `player-${Date.now()}`;
    this.playerName = playerName;
    
    this.setupEventHandlers();
  }
  
  async initialize(seedWord: string) {
    console.log(`🚀 Initializing vast semantic world with: ${seedWord}`);
    const concepts = await this.engine.initializeWithSeed(seedWord);
    this.totalConcepts = concepts.size;
    
    // Initialize multiplayer if available
    await this.initializeMultiplayer();
    
    // Add discovery feed to DOM
    document.body.appendChild(this.discoveryFeed.getElement());
    
    this.render();
  }
  
  private async initializeMultiplayer() {
    try {
      // Check if we're in development or production
      const wsUrl = window.location.hostname === 'localhost' 
        ? 'ws://localhost:8787' 
        : 'wss://akashic-plains-multiplayer.viemccoy.workers.dev';
      
      this.multiplayer = new MultiplayerClient(this.playerId, this.playerName);
      
      // Setup multiplayer event handlers
      this.multiplayer.onPlayerJoined = (player) => {
        console.log(`🌟 ${player.name} joined the plains`);
        this.otherPlayers = this.multiplayer!.getPlayers();
        this.render();
      };
      
      this.multiplayer.onPlayerLeft = (playerId) => {
        console.log(`👋 Player left: ${playerId}`);
        this.otherPlayers = this.multiplayer!.getPlayers();
        this.render();
      };
      
      this.multiplayer.onPlayerMoved = (player) => {
        this.otherPlayers = this.multiplayer!.getPlayers();
        this.render();
      };
      
      this.multiplayer.onDiscovery = (discovery) => {
        console.log(`🔍 ${discovery.playerName} discovered ${discovery.conceptWord}`);
        this.discoveryFeed.addDiscovery(
          'concept',
          discovery.playerName,
          discovery.playerId,
          discovery.conceptWord,
          discovery.position
        );
      };
      
      this.multiplayer.onSynthesisCreated = (data) => {
        console.log(`✨ ${data.creatorName} created synthesis: ${data.synthesis.name}`);
        // Add to local engine
        this.engine.addGlobalSynthesis(data.synthesis);
        // Add to discovery feed
        this.discoveryFeed.addDiscovery(
          'synthesis',
          data.creatorName,
          data.synthesis.createdBy,
          data.synthesis.name,
          data.synthesis.position,
          data.synthesis.coordinates
        );
        this.render();
      };
      
      this.multiplayer.onConnectionStateChange = (connected) => {
        this.multiplayerEnabled = connected;
        console.log(`🌐 Multiplayer: ${connected ? 'Connected' : 'Disconnected'}`);
        this.render();
      };
      
      // Attempt connection
      await this.multiplayer.connect(wsUrl);
      
    } catch (error) {
      console.warn('Multiplayer not available:', error);
      this.multiplayerEnabled = false;
    }
  }
  
  private setupEventHandlers() {
    // Handle teleport events from discovery feed
    window.addEventListener('teleport-to-coordinates', (e: any) => {
      const { coordinates } = e.detail;
      const position = this.engine.teleportToCoordinates(coordinates);
      if (position) {
        this.playerPos = { ...position };
        this.render();
        
        // Broadcast new position
        if (this.multiplayer && this.multiplayerEnabled) {
          this.multiplayer.sendPosition(this.playerPos.x, this.playerPos.y);
        }
      }
    });
    
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
          if (this.currentConcept && !this.currentSynthesis) {
            const bookmarked = this.engine.bookmarkConcept(this.currentConcept.id);
            console.log(`${bookmarked ? '◈ Bookmarked' : '◇ Unbookmarked'}: ${this.currentConcept.word}`);
            this.render();
          }
          break;
        case 't':
          // Teleport command
          this.showTeleportDialog();
          break;
        case 'g':
          // Show global syntheses
          this.showGlobalSyntheses();
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
    if (newX < 0 || newX >= 256 || newY < 0 || newY >= 256) return;
    
    this.playerPos.x = newX;
    this.playerPos.y = newY;
    
    // Broadcast position to other players
    if (this.multiplayer && this.multiplayerEnabled) {
      this.multiplayer.sendPosition(newX, newY);
    }
    
    // Explore the new tile
    const discovery = await this.engine.exploreTile(newX, newY, this.playerId);
    if (discovery) {
      if ('word' in discovery) {
        // Check if this is a new discovery (not already discovered)
        if (!discovery.discovered || discovery.visitors.size === 1) {
          console.log(`📖 Discovered: ${discovery.word}`);
          this.discoveries++;
          
          // Add to local discovery feed only for first discovery
          this.discoveryFeed.addDiscovery(
            'concept',
            this.playerName,
            this.playerId,
            discovery.word,
            { x: newX, y: newY }
          );
          
          // Broadcast discovery to other players
          if (this.multiplayer && this.multiplayerEnabled) {
            this.multiplayer.sendDiscovery(discovery.word, { x: newX, y: newY });
          }
        } else {
          console.log(`📖 Revisited: ${discovery.word}`);
        }
      } else {
        console.log(`✨ Found synthesis: ${discovery.name}`);
      }
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
    
    // Convert PlayerState to format expected by renderer
    const otherPlayersForRender = this.otherPlayers.map(p => ({
      x: p.position.x,
      y: p.position.y,
      name: p.name
    }));
    
    // Render terrain
    const terrainLines = this.renderer.renderTerrain(
      tiles,
      concepts,
      syntheses,
      this.playerPos.x,
      this.playerPos.y,
      otherPlayersForRender
    );
    
    // Get bookmarks
    const bookmarks = this.engine.getBookmarkedConcepts();
    
    // Calculate discovery progress
    const discoveredConcepts = concepts.filter(c => c.discovered).length;
    const progressPercent = (discoveredConcepts / Math.max(1, this.totalConcepts)) * 100;
    
    app.innerHTML = `
      <div class="semantic-topology-engine">
        <header class="engine-header">
          <h1 class="engine-title">AKASHIC PLAINS - SEMANTIC TOPOLOGY ENGINE</h1>
          <div class="player-stats">
            <div class="stat">
              <span class="stat-label">Explorer:</span>
              <span class="stat-value player-name-editor">
                ${this.isEditingName ? `
                  <input type="text" 
                    class="player-name-input" 
                    id="player-name-input"
                    value="${this.playerName}" 
                    maxlength="20"
                    autocomplete="off"
                  />
                ` : `
                  <span class="player-name-display" id="player-name-display">
                    ${this.playerName}
                  </span>
                `}
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">Position:</span>
              <span class="stat-value">(${this.playerPos.x}, ${this.playerPos.y})</span>
            </div>
            <div class="stat">
              <span class="stat-label">Discoveries:</span>
              <span class="stat-value">${this.discoveries}</span>
            </div>
            ${this.multiplayerEnabled ? `
              <div class="stat">
                <span class="stat-label">Online:</span>
                <span class="stat-value" style="color: #00ff00;">●${this.otherPlayers.length + 1}</span>
              </div>
            ` : ''}
          </div>
        </header>
        
        <aside class="left-panel">
          ${this.renderBookmarksPanel(bookmarks)}
          ${this.renderSynthesisPanel(bookmarks)}
        </aside>
        
        <main class="exploration-area">
          <div class="terrain-viewport">
            ${this.currentConcept || this.currentSynthesis ? `
              <div class="current-location-float">
                ${this.renderCurrentInfo()}
              </div>
            ` : ''}
            <div class="terrain-frame">
              <pre class="terrain-display">${terrainLines.join('\n')}</pre>
            </div>
            <div class="fog-overlay"></div>
          </div>
        </main>
        
        <aside class="right-panel">
          ${this.renderDiscoveriesPanel(concepts.filter(c => c.discovered))}
          ${this.renderNearbyPanel(concepts, syntheses)}
        </aside>
        
        <footer class="status-bar">
          <div class="controls-hint">
            WASD/↑↓←→: Move | B: Bookmark | T: Teleport | G: Global Syntheses | Click coordinates in feed to teleport
          </div>
          <div class="discovery-progress">
            <span>Exploration Progress:</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span>${Math.round(progressPercent)}%</span>
          </div>
        </footer>
      </div>
    `;
    
    // Setup synthesis button
    const synthButton = document.getElementById('create-synthesis');
    if (synthButton) {
      synthButton.addEventListener('click', async () => {
        await this.createSynthesis();
      });
    }
    
    // Setup player name editor
    this.setupNameEditor();
  }
  
  private setupNameEditor() {
    const nameDisplay = document.getElementById('player-name-display');
    const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
    
    if (nameDisplay) {
      nameDisplay.addEventListener('click', () => {
        this.isEditingName = true;
        this.render();
        // Focus input after render
        setTimeout(() => {
          const input = document.getElementById('player-name-input') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
      });
    }
    
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.savePlayerName(nameInput.value);
        } else if (e.key === 'Escape') {
          this.isEditingName = false;
          this.render();
        }
      });
      
      nameInput.addEventListener('blur', () => {
        this.savePlayerName(nameInput.value);
      });
    }
  }
  
  private savePlayerName(newName: string) {
    newName = newName.trim();
    if (newName && newName !== this.playerName) {
      this.playerName = newName;
      localStorage.setItem('akashic-player-name', newName);
      
      // Update multiplayer if connected
      if (this.multiplayer && this.multiplayerEnabled) {
        // Disconnect and reconnect with new name
        this.multiplayer.disconnect();
        this.initializeMultiplayer();
      }
    }
    
    this.isEditingName = false;
    this.render();
  }
  
  private renderCurrentInfo(): string {
    if (this.currentSynthesis) {
      return `
        <h3 class="synthesis-name">✨ ${this.currentSynthesis.name} ✨</h3>
        <div class="synthesis-source">Fused from: ${this.currentSynthesis.sourceWords.join(' + ')}</div>
        <div class="synthesis-definition">${this.currentSynthesis.definition}</div>
        <div class="synthesis-revelation">${this.currentSynthesis.revelation}</div>
        <div class="synthesis-coordinates">Coordinates: ${this.currentSynthesis.coordinates}</div>
      `;
    }
    
    if (this.currentConcept) {
      return `
        <h3 class="concept-name">${this.currentConcept.word.toUpperCase()}</h3>
        <div class="concept-definition">${this.currentConcept.definition}</div>
        ${this.currentConcept.insight ? `<div class="concept-insight">${this.currentConcept.insight}</div>` : ''}
        ${this.currentConcept.etymology ? `<div class="concept-etymology">Origin: ${this.currentConcept.etymology}</div>` : ''}
      `;
    }
    
    return '';
  }
  
  private renderBookmarksPanel(bookmarks: any[]): string {
    return `
      <div class="panel-section bookmarks-panel">
        <h3 class="panel-header">
          <span class="panel-icon">◈</span>
          BOOKMARKED CONCEPTS
        </h3>
        ${bookmarks.length === 0 ? `
          <div class="no-bookmarks">Press B on a concept to bookmark it</div>
        ` : `
          <div class="bookmarks-list">
            ${bookmarks.map(concept => `
              <div class="bookmark-item">
                <span class="bookmark-symbol">◈</span>
                <div class="bookmark-content">
                  <div class="bookmark-word">${concept.word}</div>
                  <div class="bookmark-definition">${concept.definition}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
  
  private renderSynthesisPanel(bookmarks: any[]): string {
    const canSynthesize = bookmarks.length >= 2;
    
    return `
      <div class="panel-section synthesis-panel">
        <h3 class="panel-header">
          <span class="panel-icon">✧</span>
          SYNTHESIS CHAMBER
        </h3>
        ${canSynthesize ? `
          <button class="synthesis-button synthesis-ready" id="create-synthesis">
            ✧ CRYSTALLIZE SYNTHESIS ✧
          </button>
          <div class="synthesis-hint">
            Fuse ${bookmarks.length} concepts into new understanding
          </div>
        ` : `
          <div class="synthesis-hint">
            Bookmark ${2 - bookmarks.length} more concept(s) to synthesize
          </div>
        `}
      </div>
    `;
  }
  
  private renderDiscoveriesPanel(discoveries: any[]): string {
    const recent = discoveries.slice(-10).reverse();
    
    return `
      <div class="panel-section discoveries-panel">
        <h3 class="panel-header">
          <span class="panel-icon">📖</span>
          RECENT DISCOVERIES
        </h3>
        <div class="discoveries-list">
          ${recent.map(concept => `
            <div class="discovery-item">
              <div class="discovery-symbol">${this.getConceptSymbol(concept.elevation)}</div>
              <div class="discovery-info">
                <div class="discovery-word">${concept.word}</div>
                <div class="discovery-meta">
                  ${this.getAbstractionLabel(concept.elevation)} • 
                  ${concept.visitors.size} visitor(s)
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  private renderNearbyPanel(concepts: any[], syntheses: any[]): string {
    const nearby = [...concepts, ...syntheses]
      .filter(item => {
        const dx = item.position.x - this.playerPos.x;
        const dy = item.position.y - this.playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 0 && dist < 15;
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
      .slice(0, 8);
    
    return `
      <div class="panel-section nearby-panel">
        <h3 class="panel-header">
          <span class="panel-icon">⟐</span>
          NEARBY DISCOVERIES
        </h3>
        <div class="nearby-list">
          ${nearby.map(item => {
            const dx = item.position.x - this.playerPos.x;
            const dy = item.position.y - this.playerPos.y;
            const direction = this.getDirection(dx, dy);
            const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
            const isSynthesis = 'sourceWords' in item;
            
            return `
              <div class="nearby-hint ${!item.discovered && !isSynthesis ? 'undiscovered-glow' : ''}">
                <div class="hint-direction">${direction}</div>
                <div class="hint-info">
                  <div class="hint-word">
                    ${isSynthesis ? '✨ ' : ''}
                    ${item.discovered || isSynthesis ? item.word || item.name : '???'}
                  </div>
                  <div class="hint-distance">${distance}m away</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  private getConceptSymbol(abstraction: number): string {
    if (abstraction > 0.8) return '▲';
    if (abstraction > 0.6) return '◭';
    if (abstraction > 0.4) return '◊';
    if (abstraction > 0.2) return '○';
    return '◦';
  }
  
  private getAbstractionLabel(level: number): string {
    if (level > 0.8) return 'Fundamental';
    if (level > 0.6) return 'Abstract';
    if (level > 0.4) return 'General';
    if (level > 0.2) return 'Applied';
    return 'Concrete';
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
      console.log(`📍 Coordinates: ${synthesis.coordinates}`);
      
      // Add to local discovery feed
      this.discoveryFeed.addDiscovery(
        'synthesis',
        this.playerName,
        this.playerId,
        synthesis.name,
        synthesis.position,
        synthesis.coordinates
      );
      
      // Broadcast synthesis to other players
      if (this.multiplayer && this.multiplayerEnabled) {
        this.multiplayer.sendSynthesisCreated(synthesis);
      }
      
      // Clear bookmarks
      bookmarks.forEach(b => this.engine.bookmarkConcept(b.id));
      
      // Teleport to synthesis location
      this.playerPos = { ...synthesis.position };
      
      // Broadcast new position
      if (this.multiplayer && this.multiplayerEnabled) {
        this.multiplayer.sendPosition(this.playerPos.x, this.playerPos.y);
      }
    }
    
    this.render();
  }
  
  private showTeleportDialog() {
    const coords = prompt('Enter synthesis coordinates (e.g., QC-140-120):');
    if (coords) {
      const position = this.engine.teleportToCoordinates(coords);
      if (position) {
        this.playerPos = { ...position };
        this.render();
      } else {
        alert('Coordinates not found!');
      }
    }
  }
  
  private showGlobalSyntheses() {
    const syntheses = this.engine.getGlobalSyntheses();
    const list = syntheses.map(s => 
      `${s.name} - ${s.coordinates} (by ${s.createdBy})`
    ).join('\n');
    
    alert(`Global Syntheses:\n\n${list}`);
  }
}