import type { TerrainTile, Concept } from './EnhancedSemanticEngine';
import type { GlobalSynthesis } from './RichSemanticEngine';

export class TerrainRenderer {
  private playerIcon = '☉'; // Sun symbol for the explorer
  private bookmarkIcon = '◈'; // Special diamond for bookmarked concepts
  private synthesisIcons = ['✦', '✧', '⟡', '✪', '❋']; // Sparkly synthesis symbols
  
  renderTerrain(
    tiles: TerrainTile[][],
    concepts: Concept[],
    syntheses: GlobalSynthesis[],
    playerX: number,
    playerY: number,
    otherPlayers: Array<{ x: number; y: number; name: string }>
  ): string[] {
    const viewRadius = Math.floor(tiles.length / 2);
    const lines: string[] = [];
    
    // Create concept/synthesis position maps for quick lookup
    const conceptMap = new Map<string, Concept>();
    for (const concept of concepts) {
      const key = `${concept.position.x},${concept.position.y}`;
      conceptMap.set(key, concept);
    }
    
    const synthesisMap = new Map<string, GlobalSynthesis>();
    for (const synthesis of syntheses) {
      const key = `${synthesis.position.x},${synthesis.position.y}`;
      synthesisMap.set(key, synthesis);
    }
    
    for (let y = 0; y < tiles.length; y++) {
      let line = '';
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        const worldX = playerX + (x - viewRadius);
        const worldY = playerY + (y - viewRadius);
        
        // Check for player
        if (x === viewRadius && y === viewRadius) {
          line += this.playerIcon;
          continue;
        }
        
        // Check for other players
        const otherPlayer = otherPlayers.find(p => 
          p.x === worldX && p.y === worldY
        );
        if (otherPlayer) {
          line += '☺';
          continue;
        }
        
        // Check for synthesis
        const synthesis = synthesisMap.get(`${worldX},${worldY}`);
        if (synthesis) {
          const iconIndex = synthesis.createdAt % this.synthesisIcons.length;
          line += this.synthesisIcons[iconIndex];
          continue;
        }
        
        // Check for concept
        const concept = conceptMap.get(`${worldX},${worldY}`);
        if (concept) {
          if (concept.bookmarked) {
            line += this.bookmarkIcon;
          } else if (concept.discovered) {
            line += this.getConceptSymbol(concept.elevation);
          } else {
            // Undiscovered concept - show as mysterious terrain
            line += this.getTerrainChar(tile.elevation * 0.7);
          }
          continue;
        }
        
        // Override character for special tiles
        if (tile.char) {
          line += tile.char;
          continue;
        }
        
        // Trail intensity
        if (tile.trailIntensity > 10) {
          line += '═';
        } else if (tile.trailIntensity > 5) {
          line += '─';
        } else if (tile.trailIntensity > 2) {
          line += '·';
        } else {
          // Regular terrain based on elevation
          line += this.getTerrainChar(tile.elevation);
        }
      }
      lines.push(line);
    }
    
    return lines;
  }
  
  private getTerrainChar(elevation: number): string {
    // ASCII terrain based on elevation
    if (elevation < 0.1) return ' ';
    if (elevation < 0.2) return '.';
    if (elevation < 0.3) return '·';
    if (elevation < 0.4) return '░';
    if (elevation < 0.5) return '▒';
    if (elevation < 0.6) return '▓';
    if (elevation < 0.7) return '█';
    if (elevation < 0.85) return '▀';
    return '■';
  }
  
  private getConceptSymbol(abstraction: number): string {
    if (abstraction > 0.8) return '▲'; // Peak - fundamental concepts
    if (abstraction > 0.6) return '◭'; // Mountain - abstract ideas
    if (abstraction > 0.4) return '◊'; // Hill - general concepts
    if (abstraction > 0.2) return '○'; // Plain - practical ideas
    return '◦'; // Valley - concrete examples
  }
  
  renderConceptInfo(concept: Concept | null, synthesis: GlobalSynthesis | null): string {
    if (synthesis) {
      return `
        <div class="synthesis-info">
          <h3 class="synthesis-name">✨ ${synthesis.name} ✨</h3>
          <div class="synthesis-source">Synthesized from: ${synthesis.sourceWords.join(' + ')}</div>
          <div class="synthesis-definition">${synthesis.definition}</div>
          ${synthesis.revelation ? `<div class="synthesis-revelation">${synthesis.revelation}</div>` : ''}
          <div class="synthesis-meta">
            Created by ${synthesis.createdBy} | 
            Discovered by ${synthesis.discoveredBy.size} explorers
          </div>
        </div>
      `;
    }
    
    if (concept) {
      const bookmarkStatus = concept.bookmarked ? ' (Bookmarked)' : '';
      return `
        <div class="concept-info">
          <h3 class="concept-name">${concept.word.toUpperCase()}${bookmarkStatus}</h3>
          <div class="concept-definition">${concept.definition}</div>
          <div class="concept-insight">${concept.insight}</div>
          <div class="concept-related">
            Related: ${concept.relatedWords.slice(0, 5).join(', ')}
          </div>
          <div class="concept-meta">
            Abstraction: ${this.getAbstractionLabel(concept.elevation)} | 
            Visitors: ${concept.visitors.size}
          </div>
        </div>
      `;
    }
    
    return `
      <div class="terrain-info">
        <h3>UNCHARTED SEMANTIC TERRITORY</h3>
        <div>Explore to discover hidden concepts in the landscape of meaning.</div>
        <div class="hint">Look for symbols that might indicate undiscovered wisdom.</div>
      </div>
    `;
  }
  
  private getAbstractionLabel(level: number): string {
    if (level > 0.8) return 'Fundamental';
    if (level > 0.6) return 'Abstract';
    if (level > 0.4) return 'General';
    if (level > 0.2) return 'Applied';
    return 'Concrete';
  }
  
  renderBookmarks(bookmarks: Concept[]): string {
    if (bookmarks.length === 0) {
      return '<div class="no-bookmarks">No concepts bookmarked. Press B on a concept to bookmark it.</div>';
    }
    
    return `
      <div class="bookmarks-list">
        ${bookmarks.map(concept => `
          <div class="bookmark-item">
            <span class="bookmark-icon">◈</span>
            <span class="bookmark-word">${concept.word}</span>
          </div>
        `).join('')}
      </div>
      ${bookmarks.length >= 2 ? `
        <button class="synthesis-button" id="create-synthesis">
          ✧ CREATE SYNTHESIS ✧
        </button>
      ` : `
        <div class="synthesis-hint">Bookmark ${2 - bookmarks.length} more concept(s) to create a synthesis</div>
      `}
    `;
  }
}