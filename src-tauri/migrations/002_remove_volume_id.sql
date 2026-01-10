-- Migration: 002_remove_volume_id
-- Description: Remove volume_id column from collection_items table
-- The app now detects offline vs missing status at runtime by checking volume mount points

-- Drop the volume_id index first
DROP INDEX IF EXISTS idx_collection_items_volume_id;

-- SQLite doesn't support DROP COLUMN directly, so we need to:
-- 1. Create a new table without volume_id
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

CREATE TABLE IF NOT EXISTS collection_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('file', 'folder')),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  UNIQUE (collection_id, path)
);

-- Copy data from old table to new table
INSERT INTO collection_items_new (id, collection_id, path, item_type, added_at)
SELECT id, collection_id, path, item_type, added_at
FROM collection_items;

-- Drop old table
DROP TABLE collection_items;

-- Rename new table to original name
ALTER TABLE collection_items_new RENAME TO collection_items;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id
  ON collection_items(collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_path
  ON collection_items(path);
