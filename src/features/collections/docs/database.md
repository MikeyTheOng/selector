# Collections Schema

This document describes the schema and data invariants specifically for the Collections feature.

## Overview

Collections persist virtual file/folder groupings. The data is stored in the main app database: `selector.dev.db` in development builds and `selector.db` in release builds.

## Schema

### Tables

#### `collections`

Stores collection metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL | Collection display name |
| `created_at` | TEXT | NOT NULL, DEFAULT datetime('now') | ISO 8601 timestamp |
| `updated_at` | TEXT | NOT NULL, DEFAULT datetime('now') | ISO 8601 timestamp |

#### `collection_items`

Stores items (files/folders) within collections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `collection_id` | INTEGER | NOT NULL, FK → collections(id) ON DELETE CASCADE | Parent collection |
| `path` | TEXT | NOT NULL | Full filesystem path |
| `item_type` | TEXT | NOT NULL, CHECK IN ('file', 'folder') | Item type |
| `added_at` | TEXT | NOT NULL, DEFAULT datetime('now') | ISO 8601 timestamp |

**Unique constraint:** `(collection_id, path)` - prevents duplicate paths in the same collection.

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_collection_items_collection_id` | `collection_id` | Fast lookup of items by collection |
| `idx_collection_items_path` | `path` | Fast path lookups for global relinking |

### Entity Relationship

```
┌─────────────┐       ┌──────────────────┐
│ collections │       │ collection_items │
├─────────────┤       ├──────────────────┤
│ id (PK)     │──────<│ collection_id(FK)│
│ name        │       │ id (PK)          │
│ created_at  │       │ path             │
│ updated_at  │       │ item_type        │
└─────────────┘       │ added_at         │
                      └──────────────────┘
```

## Data Invariants

### Enforced by Schema

| Invariant | Mechanism |
|-----------|-----------|
| No duplicate paths in same collection | UNIQUE(collection_id, path) |
| Items deleted when collection deleted | ON DELETE CASCADE |
| Valid item types only | CHECK(item_type IN ('file', 'folder')) |
| Required fields present | NOT NULL constraints |

### Enforced by Application

| Invariant | Location |
|-----------|----------|
| Collection names cannot be empty/whitespace | `collections-service.ts` |
| Global relinking updates all collections | `updateItemPath()` in service |

## Feature Locations

| Component | Path |
|-----------|------|
| Collections service | `src/features/collections/lib/collections-service.ts` |
| Collections repository | `src/features/collections/lib/collections-repository.ts` |
| Collection items repository | `src/features/collections/lib/collection-items-repository.ts` |
| TypeScript types | `src/features/collections/types.ts` |
