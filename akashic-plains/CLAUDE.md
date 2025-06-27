# Akashic Plains - Development with Claude

## Project Overview

Akashic Plains is a multiplayer web application where users traverse an infinite desert of knowledge rendered in ASCII. It transforms abstract semantic relationships into explorable terrain, creating a shared consciousness map powered by Claude AI.

## Core Concept: Collaborative Knowledge Cartography

The game implements semantic exploration where:
- **Distance = Conceptual Relationship**: Semantically close concepts appear physically near each other
- **Elevation = Abstraction Level**: Abstract concepts appear as peaks, concrete ones in valleys
- **Density = Information Richness**: Complex areas show as dense terrain
- **Exploration = Learning**: Movement reveals how concepts connect

## Technical Architecture

### Frontend Stack
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Pure CSS** with CRT effects and phosphor glow
- **LocalStorage** for game persistence

### Key Systems Implemented

#### 1. Terminal Aesthetics & CRT Effects
- Scanline animations mimicking old CRT monitors
- Phosphor amber/green glow effects
- ASCII art throughout
- Monospace fonts (Fira Code)
- Screen curvature and flicker effects

#### 2. Semantic Terrain Generation
The game uses Claude AI to generate terrain based on conceptual relationships:

```typescript
// Enhanced terrain generation with 3D topology
const generateTopologicalTerrain = async (centerConcept: string) => {
  // Claude analyzes the concept for:
  // - Technical depth (0-1)
  // - Abstraction level (0-1) 
  // - Related domains
  // - Prerequisite concepts
  // - Semantic neighbors with distances
  
  // Returns elevation-based terrain where:
  // · = Deep valleys (concrete applications)
  // ░ = Valleys (practical concepts)
  // ▒ = Plains (standard knowledge)
  // ▓ = Hills (theoretical bridges)
  // █ = Mountains (abstract principles)
  // ▀ = Peaks (fundamental axioms)
};
```

#### 3. 3D ASCII Topology System
Implemented visual depth through ASCII shading:
- **Elevation mapping**: Gaussian influence fields create smooth height transitions
- **Directional shading**: Slopes shown with `╱ ╲ ═ ─` characters
- **Proximity indicators**: `◉ ● ◐` show closeness to concepts
- **Concept labels**: Names embedded directly in terrain

#### 4. Dynamic Concept Expansion
- Concepts generate based on player movement direction
- Semantic neighbors placed according to relationship types:
  - Prerequisites appear "below" (lower elevation)
  - Applications appear in valleys
  - Generalizations appear as peaks
  - Parallel concepts at similar elevations

#### 5. Multi-Agent AI System
Three specialized Claude agents work together:

1. **Semantic Engine**: Analyzes concepts for dimensions and relationships
2. **Terrain Generator**: Creates topographical maps based on semantics  
3. **Synthesis Manager**: Fuses bookmarked concepts into new knowledge

#### 6. Game State Management
- **SemanticGameManager**: Orchestrates exploration with concept tracking
- **Trail persistence**: Tracks movement patterns for desire paths
- **Energy system**: Movement costs less on well-traveled paths
- **Chunk loading**: Infinite world with dynamic generation

#### 7. Knowledge Synthesis
Players can bookmark sacred sites and synthesize them:
- Combines 2+ concepts into new crystallized wisdom
- AI analyzes semantic space between bookmarks
- Generates novel concepts that bridge them
- New crystals appear on map as explorable sites

## Implementation Details

### API Integration
- Users provide their own Claude API key (stored locally)
- All API calls happen client-side (for demo purposes)
- Graceful fallbacks for API failures

### Semantic Features
1. **Seed Concept Selection**: Players choose starting point
2. **Context-Aware Generation**: Terrain reflects movement direction
3. **Elevation Semantics**: Height represents abstraction level
4. **Concept Clustering**: Related ideas appear at similar elevations
5. **Ley Lines**: Visual connections between related concepts

### Visual Enhancements
- **Info Panel**: Shows semantic information for current position
- **Particle Effects**: Sand particles, discovery bursts, crystal formations
- **Day/Night Cycle**: Affects visibility and energy regeneration
- **Notifications**: Toast messages for discoveries
- **Save System**: Auto-saves every 30 seconds

## Key Files & Components

### Core Game Logic
- `src/game/semanticGameManager.ts` - Main game orchestration
- `src/agents/enhancedSemanticGenerator.ts` - Terrain generation with Claude
- `src/agents/semanticEngine.ts` - Concept analysis
- `src/agents/topologyGenerator.ts` - 3D ASCII elevation system

### UI Components  
- `src/components/gameScreen.ts` - Main game display
- `src/components/enhancedLocationInfo.ts` - Semantic info panel
- `src/components/seedConceptScreen.ts` - Initial concept selection
- `src/components/synthesisModal.ts` - Knowledge crystallization UI

### Effects & Polish
- `src/effects/particles.ts` - Sand particle system
- `src/effects/dayNightCycle.ts` - Time of day effects
- `src/utils/notifications.ts` - Discovery notifications
- `src/style.css` - All visual effects and animations

## Deployment

### For Development
```bash
npm install
npm run dev
# Uses .env file for API key
```

### For Production  
```bash
npm run build
npm start
# Users provide their own API keys
```

### Cloudflare Pages Setup
- Root directory: `akashic-plains`
- Build command: `npm install && npm run build`
- Build output: `dist`
- No environment variables needed

## Future Enhancements

### Multiplayer Features
- WebSocket integration for shared exploration
- See other players' trails in real-time
- Collaborative synthesis rituals
- Shared discovery notifications

### Advanced Semantics
- Paradigm shift events (sandstorms)
- Contested zones where concepts conflict
- Temporal layers showing concept evolution
- Cultural paths through same concepts

### Research Applications
- Export explored concept maps
- Learning path optimization
- Knowledge gap identification
- Cross-domain bridge discovery

## Design Philosophy

Akashic Plains transforms the invisible architecture of knowledge into a navigable landscape. By making semantic relationships spatial and giving abstract concepts physical presence, it creates an intuitive understanding of how ideas connect. The multiplayer aspect enables collaborative mapping of human knowledge, where individual curiosity contributes to a collective understanding.

The ASCII aesthetic isn't just nostalgic—it represents the fundamental nature of knowledge as patterns and symbols, while the 3D topology shows that understanding has depth and elevation. Every design choice reinforces the core metaphor: knowledge as landscape, exploration as learning, synthesis as creation.

## Commands & Controls

- **Movement**: WASD or Arrow keys
- **Bookmark**: B (at sacred sites)
- **Synthesize**: Click button with 2+ bookmarks
- **Cancel**: ESC (in modals)

## Technical Notes

- Chuck size: 16x16 tiles
- View distance: 20 tiles around player
- Energy: 100 max, regenerates over time
- Synthesis cost: 30 energy
- Auto-save: Every 30 seconds

The game successfully implements collaborative knowledge cartography, where abstract semantic relationships become explorable terrain, creating a shared map of human understanding.