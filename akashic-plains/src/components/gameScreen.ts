import type { GameState } from '../types';
import { TERRAIN_SYMBOLS, VIEW_DISTANCE } from '../types';
import { renderTerrainAroundPlayer } from '../utils/terrain';

export function renderGameScreen(state: GameState): string {
  const terrainLines = renderTerrainAroundPlayer(
    state.visitedChunks,
    state.playerPosition.x,
    state.playerPosition.y,
    VIEW_DISTANCE,
    state.discoveredSites
  );
  
  const energyPercent = (state.energy / state.maxEnergy) * 100;
  
  return `
    <div class="game-screen">
      <div class="header-bar">
        <div class="title">AKASHIC PLAINS</div>
        <div class="energy-bar">
          <span>Energy:</span>
          <div class="energy-indicator">
            <div class="energy-fill" style="width: ${energyPercent}%"></div>
          </div>
        </div>
      </div>
      
      <div class="map-viewport">
        <div class="map-content">${terrainLines.join('\n')}</div>
      </div>
      
      <div class="sidebar">
        <div class="panel">
          <div class="panel-header">LEGEND</div>
          <div class="legend-item">
            <span class="legend-symbol">${TERRAIN_SYMBOLS.PLAYER}</span>
            <span>You</span>
          </div>
          <div class="legend-item">
            <span class="legend-symbol">${TERRAIN_SYMBOLS.WANDERER}</span>
            <span>Wanderer</span>
          </div>
          <div class="legend-item">
            <span class="legend-symbol">${TERRAIN_SYMBOLS.GLYPHS}</span>
            <span>Ancient Wisdom</span>
          </div>
          <div class="legend-item">
            <span class="legend-symbol">${TERRAIN_SYMBOLS.CRYSTALS}</span>
            <span>Crystal (Synth)</span>
          </div>
        </div>
        
        <div class="panel">
          <div class="panel-header">BOOKMARKS</div>
          <div class="bookmark-list">
            ${state.bookmarkedSites.length === 0 
              ? '<div style="opacity: 0.5; font-size: 12px;">No sites bookmarked yet...</div>'
              : state.bookmarkedSites.map(site => `
                  <div class="bookmark-item" data-site-id="${site.id}">
                    <span style="color: var(--color-purple);">${site.glyph}</span> ${site.conceptName}
                  </div>
                `).join('')
            }
          </div>
          ${state.bookmarkedSites.length >= 2 
            ? '<button class="button synthesize-button">✧ SYNTHESIZE ✧</button>'
            : ''
          }
        </div>
      </div>
      
      <div class="info-panel">
        <div class="location-title">SHIFTING SANDS</div>
        <div class="location-description">
          The endless desert stretches before you, each grain of sand a potential
          thought waiting to be discovered. Use WASD or arrow keys to explore.
        </div>
        <div class="quote">
          "In the beginning was the Word, and the Word was scattered across infinite sands..."
        </div>
      </div>
    </div>
  `;
}