-- Migration: 001_collections
-- Description: Initial schema for collections feature

-- Collections table: stores collection metadata
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Collection items table: stores items (files/folders) in collections
-- Supports many-to-many relationship between collections and paths
CREATE TABLE IF NOT EXISTS collection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('file', 'folder')),
  volume_id TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  UNIQUE (collection_id, path)
);

-- Index for faster lookups by collection
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id
  ON collection_items(collection_id);

-- Index for faster path lookups (for relinking across collections)
CREATE INDEX IF NOT EXISTS idx_collection_items_path
  ON collection_items(path);

-- Index for volume-based queries (for external volume status)
CREATE INDEX IF NOT EXISTS idx_collection_items_volume_id
  ON collection_items(volume_id);
