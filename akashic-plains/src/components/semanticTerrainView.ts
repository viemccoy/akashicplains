import type { SacredSite, Position, TerrainChunk } from '../types';
import { getChunkFromGlobal, getChunkKey } from '../utils/terrain';
import { CHUNK_SIZE } from '../types';

interface TerrainInfo {
  symbol: string;
  elevation: number;
  concept?: string;
}

interface ConceptInfo {
  name: string;
  symbol: string;
  explanation?: string;
  fact?: string;
  distance: number;
}

export function renderSemanticTerrainView(
  currentLocation: SacredSite | null,
  nearbyLocations: SacredSite[],
  terrainInfo: TerrainInfo | null,
  playerPosition: Position,
  visitedChunks: Map<string, TerrainChunk>,
  conceptMap?: Map<string, any>
): string {
  // Get larger terrain preview around player
  const previewRadius = 6;
  const terrainPreview = getTerrainPreview(
    playerPosition,
    visitedChunks,
    previewRadius
  );
  
  // Get nearby concepts with explanations
  const nearbyConcepts = getNearbyConcepts(
    playerPosition,
    nearbyLocations,
    conceptMap
  );
  
  return `
    <div class="semantic-terrain-view">
      <div class="terrain-preview">
${terrainPreview}
      </div>
      
      <div class="terrain-concepts">
        ${nearbyConcepts.slice(0, 5).map(concept => `
          <div class="concept-entry">
            <span class="concept-symbol">${concept.symbol}</span>
            <span class="concept-name">${concept.name}</span>
            <span class="concept-fact">${concept.fact || concept.explanation || 'Ancient wisdom'}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="location-details">
      ${currentLocation ? `
        <div class="location-title">${currentLocation.conceptName.toUpperCase()}</div>
        <div class="location-description">${currentLocation.explanation || 'The essence of ' + currentLocation.conceptName + ' permeates this place.'}</div>
        ${currentLocation.leyLines.length > 0 ? `
          <div class="ley-lines">Ley lines connect to: ${currentLocation.leyLines.join(', ')}</div>
        ` : ''}
      ` : `
        <div class="location-title">${getTerrainDescription(terrainInfo)}</div>
        <div class="location-description">
          ${getLocationDescription(terrainInfo, nearbyLocations)}
        </div>
      `}
      
      <div class="elevation-info">
        Elevation: ${getElevationDescription(terrainInfo?.elevation || 0.5)}
      </div>
      
      ${terrainInfo?.concept ? `
        <div class="semantic-info">
          You sense the influence of <span class="concept-highlight">${terrainInfo.concept}</span> here.
        </div>
      ` : ''}
    </div>
  `;
}

function getTerrainPreview(
  playerPos: Position,
  visitedChunks: Map<string, TerrainChunk>,
  radius: number
): string {
  const lines: string[] = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    let line = '';
    for (let dx = -radius; dx <= radius; dx++) {
      const worldX = playerPos.x + dx;
      const worldY = playerPos.y + dy;
      
      // Get chunk and local position
      const { chunkX, chunkY } = getChunkFromGlobal(worldX, worldY);
      const chunk = visitedChunks.get(getChunkKey(chunkX, chunkY));
      
      if (chunk) {
        const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const char = chunk.terrain[localY]?.[localX] || '?';
        
        // Highlight player position
        if (dx === 0 && dy === 0) {
          line += '@';
        } else {
          line += char;
        }
      } else {
        line += '?';
      }
    }
    lines.push(line);
  }
  
  return lines.join('\n');
}

function getNearbyConcepts(
  playerPos: Position,
  nearbyLocations: SacredSite[],
  conceptMap?: Map<string, any>
): ConceptInfo[] {
  const concepts: ConceptInfo[] = [];
  
  for (const site of nearbyLocations) {
    const dx = site.position.x - playerPos.x;
    const dy = site.position.y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Get additional info from concept map if available
    const conceptData = conceptMap?.get(site.conceptName);
    
    concepts.push({
      name: site.conceptName,
      symbol: site.glyph,
      explanation: site.explanation,
      fact: conceptData?.fact,
      distance
    });
  }
  
  // Sort by distance
  return concepts.sort((a, b) => a.distance - b.distance);
}

function getTerrainDescription(terrainInfo: TerrainInfo | null): string {
  if (!terrainInfo) return 'UNKNOWN TERRITORY';
  
  const symbol = terrainInfo.symbol;
  
  // Map symbols to descriptive names
  const terrainNames: Record<string, string> = {
    '·': 'DEEP VALLEYS',
    '░': 'SANDY VALLEYS',
    '▒': 'RISING PLAINS',
    '▓': 'SEMANTIC HILLS',
    '█': 'ABSTRACT MOUNTAINS',
    '▀': 'CONCEPTUAL PEAKS',
    '╱': 'ASCENDING SLOPE',
    '╲': 'DESCENDING SLOPE',
    '═': 'RIDGELINE',
    '─': 'PLATEAU',
    '◉': 'DENSE KNOWLEDGE',
    '●': 'WISDOM CLUSTER',
    '◐': 'SEMANTIC FIELD'
  };
  
  return terrainNames[symbol] || 'SHIFTING SANDS';
}

function getLocationDescription(
  terrainInfo: TerrainInfo | null,
  nearbyLocations: SacredSite[]
): string {
  if (!terrainInfo) {
    return 'The endless desert stretches before you, each grain of sand a potential thought waiting to be discovered.';
  }
  
  const elevation = terrainInfo.elevation;
  let description = '';
  
  if (elevation > 0.8) {
    description = 'You stand atop abstract peaks where fundamental principles crystallize into pure understanding.';
  } else if (elevation > 0.6) {
    description = 'Theoretical bridges span between concepts here, connecting disparate domains of knowledge.';
  } else if (elevation > 0.4) {
    description = 'The semantic plains stretch endlessly, where ideas flow and mingle freely.';
  } else if (elevation > 0.2) {
    description = 'Practical valleys carved by application and experience spread before you.';
  } else {
    description = 'Deep in the valleys of concrete reality, where theory becomes practice.';
  }
  
  if (nearbyLocations.length > 0) {
    const nearest = nearbyLocations[0];
    description += ` The influence of ${nearest.conceptName} permeates the air.`;
  }
  
  return description;
}

function getElevationDescription(elevation: number): string {
  if (elevation > 0.8) return 'Peak (Abstract Principles)';
  if (elevation > 0.6) return 'Mountain (Theoretical Concepts)';
  if (elevation > 0.4) return 'Hill (Standard Knowledge)';
  if (elevation > 0.2) return 'Plain (Practical Understanding)';
  return 'Valley (Concrete Applications)';
}