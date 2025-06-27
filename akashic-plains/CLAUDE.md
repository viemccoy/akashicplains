# Akashic Plains V2 - Development with Claude

## Project Overview

Akashic Plains is a **real-time multiplayer** web application where users traverse an infinite desert of knowledge rendered in ASCII. It transforms abstract semantic relationships into explorable terrain, creating a shared consciousness map powered by Claude AI. Version 2 introduces true multiplayer with WebSocket communication, global synthesis sharing, and Claude Sonnet 4 for enhanced creative synthesis generation.

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
- **IndexedDB** for persistent storage
- **WebSocket** for real-time multiplayer

### Backend Stack (V2)
- **Cloudflare Workers** for edge computing
- **Durable Objects** for stateful world management
- **D1 Database** for global synthesis storage
- **KV Namespace** for player sessions

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
Specialized Claude models for different tasks:

1. **Claude 3.5 Haiku**: Fast concept generation and terrain mapping
2. **Claude Sonnet 4**: Deep synthesis creation with poetic insights
3. **Semantic Engine**: Analyzes relationships and places concepts

#### 6. Game State Management
- **SemanticGameManager**: Orchestrates exploration with concept tracking
- **Trail persistence**: Tracks movement patterns for desire paths
- **Energy system**: Movement costs less on well-traveled paths
- **Chunk loading**: Infinite world with dynamic generation

#### 7. Knowledge Synthesis (Enhanced in V2)
Players can bookmark sacred sites and synthesize them:
- Combines 2+ concepts into new crystallized wisdom
- Claude Sonnet 4 creates poetic synthesis names and revelations
- Generates novel concepts that bridge bookmarked ideas
- New syntheses appear globally for all players to discover
- Unique coordinates (e.g., "QC-140-120") for sharing locations

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

## Key Files & Components (V2)

### Core Game Logic
- `src/CenteredSemanticGame.ts` - Main game controller with multiplayer
- `src/engine/RichSemanticEngine.ts` - 256x256 world with dynamic generation
- `src/engine/WordGenerator.ts` - Claude integration for concepts & synthesis
- `src/engine/TerrainRenderer.ts` - ASCII terrain with multiplayer support

### Multiplayer System
- `src/multiplayer/MultiplayerClient.ts` - WebSocket client with auto-reconnect
- `workers/websocket-gateway.ts` - Cloudflare Worker for real-time sync
- `workers/schema.sql` - Database schema for global syntheses

### UI Components  
- `src/ui/CenteredUI.css` - Centered layout with exploration focus
- `src/components/ConceptGraph.ts` - Interactive semantic relationship graph
- `src/components/MiniMap.ts` - Overview of explored areas
- `src/utils/PersistenceManager.ts` - IndexedDB for local storage

### Performance & Polish
- `src/utils/PerformanceOptimizer.ts` - Frame rate optimization
- `src/utils/ErrorHandler.ts` - Graceful error handling
- No fog of war - clear ASCII rendering

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

## Multiplayer Features (Implemented in V2)

### Real-Time Collaboration
- ✅ WebSocket integration for shared exploration
- ✅ See other players in real-time (☺ symbols)
- ✅ Global synthesis sharing with coordinates
- ✅ Discovery notifications for all players
- ✅ Online player count indicator

### Infrastructure
- ✅ Cloudflare Workers for edge computing
- ✅ Durable Objects for world state
- ✅ D1 Database for permanent storage
- ✅ Automatic reconnection handling

## Future Enhancements

### Advanced Features
- Global discovery feed UI
- Collaborative synthesis rituals (multi-player)
- Player trails heat map visualization
- Chat/emotes system
- Leaderboards and achievements

### Semantic Evolution
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

## Version 2 Achievements

Akashic Plains V2 successfully implements:
- **True Multiplayer**: Real-time player synchronization via WebSockets
- **Claude Sonnet 4**: Enhanced synthesis generation with deeper insights
- **Global Synthesis System**: All players contribute to a shared semantic map
- **Scalable Architecture**: Cloudflare edge computing for low latency
- **Clear ASCII Rendering**: Removed fog of war for better visibility

The game has evolved from a single-player prototype to a collaborative knowledge cartography platform, where abstract semantic relationships become explorable terrain, creating a shared map of human understanding that grows with every player's journey.