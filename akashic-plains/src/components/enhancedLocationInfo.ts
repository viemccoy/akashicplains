import type { SacredSite, Position } from '../types';

interface TerrainInfo {
  symbol: string;
  elevation: number;
  concept?: string;
}

export function renderEnhancedLocationInfo(
  currentLocation: SacredSite | null,
  nearbyLocations: SacredSite[],
  terrainInfo: TerrainInfo | null,
  playerPosition: Position
): string {
  if (currentLocation) {
    return renderSacredSiteInfo(currentLocation, nearbyLocations, terrainInfo);
  }
  
  return renderTerrainInfo(nearbyLocations, terrainInfo, playerPosition);
}

function renderSacredSiteInfo(
  site: SacredSite,
  nearby: SacredSite[],
  terrainInfo: TerrainInfo | null
): string {
  const typeDisplay = {
    temple: 'ANCIENT TEMPLE',
    pyramid: 'SACRED PYRAMID',
    oasis: 'MYSTICAL OASIS',
    crystals: 'CRYSTAL FORMATION',
    obelisk: 'ENIGMATIC OBELISK'
  };
  
  const elevationDesc = getElevationDescription(terrainInfo?.elevation || site.wisdomDensity);
  const nearbyNames = nearby.slice(0, 3).map(s => s.conceptName).join(', ');
  
  return `
    <div class="location-title">${typeDisplay[site.siteType]} OF ${site.conceptName.toUpperCase()}</div>
    <div class="elevation-info">Elevation: ${elevationDesc}</div>
    <div class="location-description">
      ${site.explanation || generateSiteDescription(site)}
    </div>
    ${site.pilgrims === 1 ? 
      '<div class="sacred-text">You are the first to discover this sacred site!</div>' : 
      `<div class="quote">${site.pilgrims} wanderers have visited this place...</div>`
    }
    <div class="semantic-info">
      Wisdom Density: ${(site.wisdomDensity * 100).toFixed(0)}%<br>
      Semantic Type: ${site.siteType}
    </div>
    ${nearby.length > 0 ? 
      `<div class="ley-lines">❯ Conceptual connections: ${nearbyNames}</div>` : 
      '<div class="ley-lines">❯ This concept stands alone in the semantic space...</div>'
    }
    <div style="margin-top: 10px; opacity: 0.7; font-size: 12px;">
      Press [B] to bookmark this location
    </div>
  `;
}

function renderTerrainInfo(
  nearby: SacredSite[],
  terrainInfo: TerrainInfo | null,
  playerPosition: Position
): string {
  const terrainSymbol = terrainInfo?.symbol || '·';
  const elevation = terrainInfo?.elevation || 0;
  const elevationDesc = getElevationDescription(elevation);
  
  // Describe terrain based on symbol
  const terrainDescriptions: Record<string, string> = {
    '·': 'sparse semantic void, waiting to be explored',
    '░': 'the valleys between concepts, where ideas flow and merge',
    '▒': 'the plains of understanding, where knowledge spreads evenly',
    '▓': 'the rising hills of abstraction, climbing toward deeper truths',
    '█': 'the mountains of theory, where fundamental principles reside',
    '▀': 'the peaks of pure abstraction, touching the limits of thought',
    '╱': 'a steep conceptual slope, bridging different levels of understanding',
    '╲': 'a descending path between abstract and concrete',
    '═': 'a semantic ridge, connecting related concepts',
    '─': 'a gentle transition between ideas'
  };
  
  const description = terrainDescriptions[terrainSymbol] || 'mysterious semantic terrain';
  
  const nearbyText = nearby.length > 0
    ? `You sense ${nearby.length} concept${nearby.length > 1 ? 's' : ''} nearby: ${nearby.slice(0, 3).map(s => s.conceptName).join(', ')}`
    : "The semantic landscape stretches endlessly here.";
  
  const quotes = [
    "Knowledge is a landscape - some peaks can only be reached by crossing valleys.",
    "In the topology of thought, distance is measured in understanding.",
    "Every step changes the horizon of what's knowable.",
    "The map is not the territory, but here the territory is itself a map.",
    "Climb high enough and you'll see how everything connects."
  ];
  
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  
  return `
    <div class="location-title">SEMANTIC TERRAIN</div>
    <div class="terrain-symbol">Current Terrain: <span class="sacred-text">${terrainSymbol}</span></div>
    <div class="elevation-info">Elevation: ${elevationDesc}</div>
    <div class="location-description">
      You traverse ${description}. 
      ${terrainInfo?.concept ? `The essence of <span class="concept-highlight">${terrainInfo.concept}</span> permeates this area.` : ''}
    </div>
    <div class="semantic-info">
      Position: (${playerPosition.x}, ${playerPosition.y})<br>
      Terrain Density: ${(elevation * 100).toFixed(0)}%
    </div>
    <div class="quote">"${quote}"</div>
    <div class="ley-lines">❯ ${nearbyText}</div>
  `;
}

function generateSiteDescription(site: SacredSite): string {
  const descriptions: Record<string, string[]> = {
    temple: [
      "Ancient columns of crystallized thought rise from the sand, their surfaces inscribed with glowing glyphs.",
      "The temple walls pulse with accumulated wisdom, each stone a meditation frozen in time.",
      "Ethereal light emanates from within, casting shadows that seem to spell out profound truths."
    ],
    pyramid: [
      "This monument to eternal knowledge pierces the sky, its apex touching realms beyond perception.",
      "Each level of the pyramid represents a deeper understanding, ascending toward ultimate truth.",
      "The structure hums with potential energy, as if reality itself bends around its perfect geometry."
    ],
    oasis: [
      "Crystal-clear waters reflect not the sky, but the depths of consciousness itself.",
      "Knowledge flows here like water, pooling in natural basins of understanding.",
      "The oasis blooms with insights, each ripple on the water's surface a new revelation."
    ],
    crystals: [
      "Translucent formations catch and refract thoughts, creating prismatic patterns of meaning.",
      "These crystals have grown from pure ideation, their facets reflecting infinite perspectives.",
      "The air here thrums with synthesized wisdom, concepts fusing into new forms."
    ],
    obelisk: [
      "This monolith stands as a singular truth, unadorned yet profound in its simplicity.",
      "Strange symbols spiral up its surface, each one a key to deeper mysteries.",
      "The obelisk seems to exist partially outside normal space, flickering between dimensions."
    ]
  };
  
  const typeDescriptions = descriptions[site.siteType] || descriptions.obelisk;
  const description = typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  
  return `${description} This is a nexus of ${site.conceptName}, where understanding crystallizes into form.`;
}

function getElevationDescription(elevation: number): string {
  if (elevation > 0.8) return "Peak Abstraction (fundamental axioms)";
  if (elevation > 0.6) return "High Theory (abstract principles)";
  if (elevation > 0.4) return "Conceptual Bridge (theoretical connections)";
  if (elevation > 0.2) return "Applied Knowledge (practical concepts)";
  return "Concrete Valley (direct applications)";
}