-- Syntheses table for storing global synthesis creations
CREATE TABLE IF NOT EXISTS syntheses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  revelation TEXT,
  symbol TEXT,
  source_words TEXT NOT NULL, -- JSON array
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  discovered_by TEXT NOT NULL, -- JSON array
  coordinates TEXT NOT NULL
);

-- Index for position-based queries
CREATE INDEX IF NOT EXISTS idx_syntheses_position 
ON syntheses(position_x, position_y);

-- Index for creator queries
CREATE INDEX IF NOT EXISTS idx_syntheses_creator 
ON syntheses(created_by);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_syntheses_created 
ON syntheses(created_at DESC);

-- Discoveries table for tracking which players discovered which concepts
CREATE TABLE IF NOT EXISTS discoveries (
  player_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  concept_word TEXT NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  discovered_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, concept_id)
);

-- Index for player discoveries
CREATE INDEX IF NOT EXISTS idx_discoveries_player 
ON discoveries(player_id);

-- Index for concept discoveries
CREATE INDEX IF NOT EXISTS idx_discoveries_concept 
ON discoveries(concept_id);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  player_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  total_discoveries INTEGER DEFAULT 0,
  total_syntheses INTEGER DEFAULT 0,
  total_distance_traveled INTEGER DEFAULT 0,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

-- World events table (for future features)
CREATE TABLE IF NOT EXISTS world_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL, -- JSON
  position_x INTEGER,
  position_y INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Index for active events
CREATE INDEX IF NOT EXISTS idx_events_active 
ON world_events(expires_at) 
WHERE expires_at > 0;