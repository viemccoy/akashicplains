import type { SacredSite } from '../types';

export function renderLocationInfo(
  currentLocation: SacredSite | null,
  nearbyLocations: SacredSite[]
): string {
  if (currentLocation) {
    return renderSacredSite(currentLocation, nearbyLocations);
  }
  
  return renderDesertInfo(nearbyLocations);
}

function renderSacredSite(site: SacredSite, nearby: SacredSite[]): string {
  const typeDisplay = {
    temple: 'ANCIENT TEMPLE',
    pyramid: 'SACRED PYRAMID',
    oasis: 'MYSTICAL OASIS',
    crystals: 'CRYSTAL FORMATION',
    obelisk: 'ENIGMATIC OBELISK'
  };
  
  const nearbyNames = nearby.slice(0, 3).map(s => s.conceptName).join(', ');
  
  return `
    <div class="location-title">${typeDisplay[site.siteType]} OF ${site.conceptName.toUpperCase()}</div>
    <div class="location-description">
      ${generateSiteDescription(site)}
    </div>
    ${site.pilgrims === 1 ? 
      '<div class="sacred-text">You are the first to discover this sacred site!</div>' : 
      `<div class="quote">${site.pilgrims} wanderers have visited this place...</div>`
    }
    ${nearby.length > 0 ? 
      `<div class="ley-lines">❯ Ley lines flow toward: ${nearbyNames}</div>` : 
      '<div class="ley-lines">❯ This site stands alone in the vastness...</div>'
    }
    <div style="margin-top: 10px; opacity: 0.7; font-size: 12px;">
      Press [B] to bookmark this location
    </div>
  `;
}

function renderDesertInfo(nearby: SacredSite[]): string {
  const terrainDescriptions = [
    "The endless desert stretches before you, each grain of sand a potential thought waiting to be discovered.",
    "Shifting sands whisper ancient secrets, their patterns forming and reforming like thoughts in meditation.",
    "The silence here is profound, broken only by the soft susurrus of sand moving in invisible currents.",
    "You sense that beneath these dunes lie dormant concepts, awaiting the right seeker to unearth them.",
    "The horizon shimmers with possibility, reality bending where heat meets consciousness."
  ];
  
  const description = terrainDescriptions[Math.floor(Math.random() * terrainDescriptions.length)];
  
  const nearbyText = nearby.length > 0
    ? `You sense ${nearby.length} sacred site${nearby.length > 1 ? 's' : ''} nearby...`
    : "The desert seems empty here, but emptiness itself holds wisdom.";
  
  return `
    <div class="location-title">SHIFTING SANDS</div>
    <div class="location-description">
      ${description}
    </div>
    <div class="quote">
      "${getRandomQuote()}"
    </div>
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

function getRandomQuote(): string {
  const quotes = [
    "In the beginning was the Word, and the Word was scattered across infinite sands...",
    "What is consciousness but patterns in the sand, temporary yet eternal?",
    "The map is not the territory, but here, the territory dreams itself into being.",
    "To wander is to wonder, to wonder is to become.",
    "Each step erases the last, yet the journey remains inscribed in the Akashic Records.",
    "The desert remembers all who pass, encoding their thoughts in silicon and starlight.",
    "Reality is but the shadow cast by pure thought upon the sands of possibility.",
    "In emptiness, fullness; in silence, all sounds; in stillness, all motion."
  ];
  
  return quotes[Math.floor(Math.random() * quotes.length)];
}