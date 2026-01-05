# Database Architecture

This document describes the global database infrastructure, migration strategy, and standards for the project.

## Overview

The application uses a local SQLite database (`selector.db`) managed by the Tauri SQL plugin.

## Migrations

### Strategy

Migrations are managed using the **Tauri SQL plugin's built-in Rust-side migration system**:

1. **Location:** SQL files in `src-tauri/migrations/`
2. **Registration:** Migrations are registered in `src-tauri/src/lib.rs` when initializing the plugin
3. **Execution:** Migrations run automatically during app startup, before JavaScript loads
4. **Tracking:** The plugin maintains an internal `_sqlx_migrations` table to track applied versions

### Adding a New Migration

1. Create a new SQL file: `src-tauri/migrations/00X_description.sql`
2. Register in `lib.rs`:
   ```rust
   .add_migrations(
       "sqlite:selector.db",
       vec![
           Migration { version: 1, description: "create_collections", sql: include_str!("../migrations/001_collections.sql"), kind: MigrationKind::Up },
           Migration { version: 2, description: "your_migration", sql: include_str!("../migrations/002_your_migration.sql"), kind: MigrationKind::Up },
       ],
   )
   ```
3. Test locally before committing

### Rollbacks

The Tauri SQL plugin does **not** support automatic rollbacks. To reverse a migration:
- Write a new "up" migration that reverses the changes
- Or manually modify the database (development only)

## Table Registry

| Table | Feature | Description |
|-------|---------|-------------|
| `collections` | [Collections](../src/features/collections/docs/database.md) | Virtual file/folder groupings |
| `collection_items` | [Collections](../src/features/collections/docs/database.md) | Items within collections |

## Infrastructure Locations

| Component | Path |
|-----------|------|
| Migration SQL files | `src-tauri/migrations/` |
| Plugin registration | `src-tauri/src/lib.rs` |
| TypeScript DB connection | `src/lib/tauri/database.ts` |

## Database Location (Runtime)

The SQLite database is stored in the app's data directory:

- **macOS:** `~/Library/Application Support/<bundle-id>/selector.db`
- **Windows:** `%APPDATA%/<bundle-id>/selector.db`
- **Linux:** `~/.local/share/<bundle-id>/selector.db`
