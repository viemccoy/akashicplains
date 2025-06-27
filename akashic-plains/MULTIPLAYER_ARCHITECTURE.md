# Akashic Plains - Multiplayer Architecture Plan

## Overview
Transform Akashic Plains into a true multiplayer semantic exploration experience using Cloudflare's edge computing infrastructure.

## Architecture Components

### 1. Frontend (Cloudflare Pages)
- WebSocket client for real-time communication
- Optimistic UI updates for smooth gameplay
- Local state management with remote synchronization

### 2. Backend (Cloudflare Workers + Durable Objects)
- **WebSocket Gateway Worker**: Handles connections and routes messages
- **World State Durable Object**: Manages global game state per region
- **Synthesis Database (D1)**: Stores all global syntheses
- **Player Sessions (KV)**: Tracks active players

### 3. Real-time Features
- Player position synchronization (60ms update interval)
- Visible player trails and footprints
- Live discovery notifications
- Collaborative synthesis rituals
- Global chat/emotes system

## Implementation Plan

### Phase 1: Basic Multiplayer Infrastructure
1. Create WebSocket connection manager
2. Implement player position broadcasting
3. Add other player rendering
4. Setup Cloudflare Worker for WebSocket handling

### Phase 2: Persistent World State
1. Implement Durable Objects for world regions
2. Create D1 database schema for syntheses
3. Add player profile system
4. Implement discovery persistence

### Phase 3: Collaborative Features
1. Shared synthesis rituals (multiple players contribute)
2. Trail intensity based on collective exploration
3. Global discovery feed
4. Player-to-player messaging

### Phase 4: Advanced Features
1. World events (semantic storms)
2. Faction system based on concept preferences
3. Leaderboards and achievements
4. Cross-region exploration

## Technical Specifications

### WebSocket Protocol
```typescript
interface PlayerUpdate {
  type: 'position' | 'discovery' | 'synthesis' | 'chat';
  playerId: string;
  data: any;
  timestamp: number;
}
```

### World State Structure
```typescript
interface WorldRegion {
  id: string;
  players: Map<string, PlayerState>;
  discoveries: Set<string>;
  syntheses: GlobalSynthesis[];
  trails: Map<string, number>;
}
```

### Database Schema
```sql
-- Syntheses table
CREATE TABLE syntheses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  revelation TEXT,
  symbol TEXT,
  source_words TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  discovered_by TEXT NOT NULL
);

-- Discoveries table
CREATE TABLE discoveries (
  player_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  discovered_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, concept_id)
);
```

## Deployment Strategy
1. Deploy WebSocket Worker to Cloudflare
2. Setup D1 database and migrations
3. Configure Durable Objects bindings
4. Update frontend to connect to WebSocket endpoint
5. Enable gradual rollout with feature flags

## Performance Considerations
- Use regional Durable Objects to minimize latency
- Implement message batching for position updates
- Cache frequently accessed data in KV
- Use optimistic updates on client side
- Implement graceful degradation for offline play

## Security Measures
- Validate all player inputs server-side
- Rate limit synthesis creation
- Implement anti-cheat for position updates
- Secure WebSocket connections with auth tokens
- Regular backups of world state

This architecture will transform Akashic Plains into a truly collaborative exploration of human knowledge, where every player's journey contributes to the collective map of meaning.