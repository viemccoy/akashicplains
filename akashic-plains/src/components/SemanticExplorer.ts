import { SemanticTopologyEngine, type Player } from '../engine/SemanticTopologyEngine';
import { SemanticTerrainRenderer } from '../engine/SemanticTerrainRenderer';

export class SemanticExplorer {
  private engine: SemanticTopologyEngine;
  private renderer: SemanticTerrainRenderer;
  private playerId: string;
  private playerName: string;
  
  constructor(apiKey: string, playerName: string) {
    this.engine = new SemanticTopologyEngine(apiKey);
    this.renderer = new SemanticTerrainRenderer();
    this.playerId = `player-${Date.now()}`;
    this.playerName = playerName;
  }
  
  async initialize(seedConcept: string) {
    console.log(`🚀 Initializing semantic explorer with seed: ${seedConcept}`);
    
    // Generate the semantic topology
    await this.engine.generateSemanticTopology(seedConcept);
    
    // Add player at origin
    this.engine.addPlayer(this.playerId, this.playerName, { x: 0, y: 0 });
  }
  
  movePlayer(dx: number, dy: number) {
    const players = this.engine.getPlayers();
    const player = players.get(this.playerId);
    if (!player) return;
    
    const newPos = {
      x: player.position.x + dx,
      y: player.position.y + dy
    };
    
    this.engine.movePlayer(this.playerId, newPos);
  }
  
  render(): string {
    const terrain = this.engine.getTerrain();
    const players = this.engine.getPlayers();
    const player = players.get(this.playerId);
    
    if (!player) return '<div>Error: Player not found</div>';
    
    // Render the main terrain view
    const terrainLines = this.renderer.renderTerrain(terrain, player.position, players);
    
    // Get concept info for current position
    const conceptInfo = this.renderer.renderConceptInfo(terrain, player.position);
    
    // Get nearby concepts
    const nearbyConcepts = this.renderer.renderNearbyConceptsList(terrain, player.position);
    
    return `
      <div class="semantic-explorer">
        <div class="explorer-header">
          <h1>AKASHIC PLAINS - SEMANTIC TOPOLOGY</h1>
          <div class="player-info">
            Explorer: ${this.playerName} | 
            Position: (${player.position.x}, ${player.position.y}) |
            Elevation: ${this.getElevationLabel(player.position)}
          </div>
        </div>
        
        <div class="explorer-main">
          <div class="terrain-view">
            <pre class="terrain-display">${terrainLines.join('\n')}</pre>
          </div>
          
          <div class="semantic-panel">
            <div class="current-location">
              ${conceptInfo}
            </div>
            
            <div class="nearby-concepts">
              <h3>NEARBY CONCEPTS</h3>
              <div class="concepts-list">
                ${nearbyConcepts.slice(0, 8).map(({ concept, distance }) => `
                  <div class="nearby-concept">
                    <div class="concept-header">
                      <span class="concept-symbol">${this.getConceptSymbol(concept.abstractionLevel)}</span>
                      <span class="concept-name">${concept.name}</span>
                      <span class="concept-distance">${Math.round(distance)}m</span>
                    </div>
                    <div class="concept-definition">${concept.definition}</div>
                    <div class="concept-insight">${concept.insight}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="explorer-footer">
          <div class="controls-help">
            WASD/Arrows: Move | B: Bookmark | ESC: Menu
          </div>
          <div class="other-players">
            ${this.renderOtherPlayers(players)}
          </div>
        </div>
      </div>
    `;
  }
  
  private getElevationLabel(position: { x: number; y: number }): string {
    const elevation = this.engine.getElevationAt(position.x, position.y);
    
    if (elevation > 0.8) return 'Peak';
    if (elevation > 0.6) return 'Heights';
    if (elevation > 0.4) return 'Plains';
    if (elevation > 0.2) return 'Valley';
    return 'Basin';
  }
  
  private getConceptSymbol(abstractionLevel: number): string {
    if (abstractionLevel > 0.8) return '▲';
    if (abstractionLevel > 0.6) return '■';
    if (abstractionLevel > 0.4) return '◆';
    if (abstractionLevel > 0.2) return '◊';
    return '≈';
  }
  
  private renderOtherPlayers(players: Map<string, Player>): string {
    const others = Array.from(players.values()).filter(p => p.id !== this.playerId);
    
    if (others.length === 0) {
      return 'No other explorers online';
    }
    
    return `Other explorers: ${others.map(p => p.name).join(', ')}`;
  }
  
  getEngine(): SemanticTopologyEngine {
    return this.engine;
  }
}