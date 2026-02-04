-- Migration: 003_favorite_locations
-- Description: Create favorite_locations table for persistent custom favorites

CREATE TABLE IF NOT EXISTS favorite_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
