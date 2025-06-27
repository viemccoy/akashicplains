import type { SemanticTerrain, SemanticConcept, Player } from './SemanticTopologyEngine';

export class SemanticTerrainRenderer {
  private viewRadius = 12;
  
  renderTerrain(
    terrain: SemanticTerrain,
    playerPos: { x: number; y: number },
    players: Map<string, Player>
  ): string[] {
    const lines: string[] = [];
    
    for (let dy = -this.viewRadius; dy <= this.viewRadius; dy++) {
      let line = '';
      
      for (let dx = -this.viewRadius; dx <= this.viewRadius; dx++) {
        const worldX = playerPos.x + dx;
        const worldY = playerPos.y + dy;
        
        // Get terrain character
        const char = this.getTerrainChar(terrain, worldX, worldY, dx === 0 && dy === 0, players);
        line += char;
      }
      
      lines.push(line);
    }
    
    return lines;
  }
  
  private getTerrainChar(
    terrain: SemanticTerrain,
    x: number,
    y: number,
    isPlayer: boolean,
    players: Map<string, Player>
  ): string {
    // Check for player
    if (isPlayer) return '@';
    
    // Check for other players
    for (const player of players.values()) {
      if (player.position.x === x && player.position.y === y) {
        return '☺';
      }
    }
    
    // Check for concepts
    const conceptId = this.getConceptAt(terrain, x, y);
    if (conceptId) {
      const concept = terrain.concepts.get(conceptId);
      if (concept) {
        // Return elevation-based symbol for concepts
        return this.getConceptSymbol(concept.abstractionLevel);
      }
    }
    
    // Check for trails
    const trailKey = `${x},${y}`;
    const trailIntensity = terrain.trails.get(trailKey) || 0;
    if (trailIntensity > 10) return '═';
    if (trailIntensity > 5) return '─';
    if (trailIntensity > 2) return '·';
    
    // Get elevation-based terrain
    const elevation = this.getElevationAt(terrain, x, y);
    return this.getElevationChar(elevation);
  }
  
  private getConceptAt(terrain: SemanticTerrain, x: number, y: number): string | null {
    for (const concept of terrain.concepts.values()) {
      if (Math.floor(concept.position.x) === x && Math.floor(concept.position.y) === y) {
        return concept.id;
      }
    }
    return null;
  }
  
  private getElevationAt(terrain: SemanticTerrain, x: number, y: number): number {
    const radius = 16;
    const tx = x + radius;
    const ty = y + radius;
    
    if (tx >= 0 && tx < terrain.topology.length &&
        ty >= 0 && ty < terrain.topology[0]?.length) {
      return terrain.topology[ty][tx];
    }
    
    return 0;
  }
  
  private getElevationChar(elevation: number): string {
    if (elevation > 0.9) return '▀';
    if (elevation > 0.7) return '█';
    if (elevation > 0.5) return '▓';
    if (elevation > 0.3) return '▒';
    if (elevation > 0.1) return '░';
    return '·';
  }
  
  private getConceptSymbol(abstractionLevel: number): string {
    if (abstractionLevel > 0.8) return '▲'; // Peak - abstract
    if (abstractionLevel > 0.6) return '■'; // Mountain - theoretical
    if (abstractionLevel > 0.4) return '◆'; // Hill - standard
    if (abstractionLevel > 0.2) return '◊'; // Plain - practical
    return '≈'; // Valley - concrete
  }
  
  renderConceptInfo(terrain: SemanticTerrain, position: { x: number; y: number }): string {
    // Find concept at or near position
    let closestConcept: SemanticConcept | null = null;
    let closestDistance = Infinity;
    
    for (const concept of terrain.concepts.values()) {
      const dx = concept.position.x - position.x;
      const dy = concept.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance && distance < 3) {
        closestDistance = distance;
        closestConcept = concept;
      }
    }
    
    if (closestConcept) {
      return `
        <div class="concept-info">
          <h3 class="concept-name">${closestConcept.name.toUpperCase()}</h3>
          <div class="concept-definition">${closestConcept.definition}</div>
          <div class="concept-insight">${closestConcept.insight}</div>
          <div class="concept-meta">
            Abstraction: ${this.getAbstractionLabel(closestConcept.abstractionLevel)} | 
            Visitors: ${closestConcept.visitors}
            ${closestConcept.discoveredBy ? ` | Discovered by ${closestConcept.discoveredBy}` : ''}
          </div>
        </div>
      `;
    }
    
    // Show terrain info
    const elevation = this.getElevationAt(terrain, position.x, position.y);
    return `
      <div class="terrain-info">
        <h3>SEMANTIC TERRAIN</h3>
        <div>Elevation: ${this.getElevationLabel(elevation)}</div>
        <div>Navigate to discover concepts in this semantic landscape.</div>
      </div>
    `;
  }
  
  private getAbstractionLabel(level: number): string {
    if (level > 0.8) return 'Fundamental Principle';
    if (level > 0.6) return 'Abstract Theory';
    if (level > 0.4) return 'General Concept';
    if (level > 0.2) return 'Practical Application';
    return 'Concrete Example';
  }
  
  private getElevationLabel(elevation: number): string {
    if (elevation > 0.8) return 'Conceptual Peak';
    if (elevation > 0.6) return 'Theoretical Heights';
    if (elevation > 0.4) return 'Knowledge Plains';
    if (elevation > 0.2) return 'Application Valley';
    return 'Concrete Basin';
  }
  
  renderNearbyConceptsList(
    terrain: SemanticTerrain,
    playerPos: { x: number; y: number },
    radius: number = 10
  ): Array<{ concept: SemanticConcept; distance: number }> {
    const nearby: Array<{ concept: SemanticConcept; distance: number }> = [];
    
    for (const concept of terrain.concepts.values()) {
      const dx = concept.position.x - playerPos.x;
      const dy = concept.position.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        nearby.push({ concept, distance });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }
}