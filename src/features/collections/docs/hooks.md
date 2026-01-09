# Collections Hooks API

This document describes the React hooks provided by the Collections feature.

## Overview

The Collections feature provides two primary hooks for managing collections and their items:
- `useCollections`: Manages the list of all collections
- `useCollectionItems`: Manages items within a specific collection

Both hooks follow a similar pattern:
- Automatic data loading on mount
- Loading and error states
- Methods for CRUD operations that automatically refresh data

## `useCollections`

Manages the global list of collections.

### Usage

```typescript
import { useCollections } from "@/features/collections";

function MyComponent() {
  const {
    collections,
    isLoading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch,
  } = useCollections();

  // ...
}
```

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `collections` | `Collection[]` | Array of all collections, ordered by creation date (newest first) |
| `isLoading` | `boolean` | `true` while loading collections, `false` otherwise |
| `error` | `string \| null` | Error message if loading failed, `null` otherwise |
| `createCollection` | `(input: CreateCollectionInput) => Promise<Collection>` | Creates a new collection and refreshes the list |
| `updateCollection` | `(input: UpdateCollectionInput) => Promise<Collection>` | Updates a collection's name and refreshes the list |
| `deleteCollection` | `(id: number) => Promise<void>` | Deletes a collection and refreshes the list |
| `refetch` | `() => Promise<void>` | Manually refetches the collections list |

### Types

```typescript
interface Collection {
  id: number;
  name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

interface CreateCollectionInput {
  name: string; // Cannot be empty or whitespace-only
}

interface UpdateCollectionInput {
  id: number;
  name: string; // Cannot be empty or whitespace-only
}
```

### Examples

#### Creating a Collection

```typescript
const { createCollection } = useCollections();

async function handleCreate() {
  try {
    const newCollection = await createCollection({ name: "Vacation 2024" });
    console.log("Created:", newCollection);
  } catch (error) {
    console.error("Failed to create:", error);
  }
}
```

#### Updating a Collection

```typescript
const { updateCollection } = useCollections();

async function handleRename(collectionId: number, newName: string) {
  try {
    await updateCollection({ id: collectionId, name: newName });
  } catch (error) {
    console.error("Failed to rename:", error);
  }
}
```

#### Deleting a Collection

```typescript
const { deleteCollection } = useCollections();

async function handleDelete(collectionId: number) {
  if (confirm("Are you sure? This will also remove all items in the collection.")) {
    try {
      await deleteCollection(collectionId);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  }
}
```

---

## `useCollectionItems`

Manages items within a specific collection, including status detection and relinking.

### Usage

```typescript
import { useCollectionItems } from "@/features/collections";

function CollectionView({ collectionId }: { collectionId: number }) {
  const {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    relinkItem,
    relinkFolder,
    refetch,
  } = useCollectionItems(collectionId);

  // ...
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | `number` | The ID of the collection to manage items for |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `items` | `CollectionItemWithStatus[]` | Array of collection items with their status, ordered by added date (newest first) |
| `isLoading` | `boolean` | `true` while loading items, `false` otherwise |
| `error` | `string \| null` | Error message if loading failed, `null` otherwise |
| `addItem` | `(input: AddCollectionItemInput) => Promise<CollectionItem>` | Adds an item to the collection and refreshes the list |
| `removeItem` | `(itemId: number) => Promise<void>` | Removes an item from the collection and refreshes the list |
| `relinkItem` | `(oldPath: string, newPath: string) => Promise<number>` | Updates an item's path across **all collections** and refreshes the list |
| `relinkFolder` | `(oldFolderPath: string, newFolderPath: string) => Promise<number>` | Bulk updates all items within a folder across **all collections** and refreshes the list |
| `refetch` | `() => Promise<void>` | Manually refetches the collection items |

### Types

```typescript
interface CollectionItem {
  id: number;
  collection_id: number;
  path: string; // Full filesystem path
  item_type: "file" | "folder";
  volume_id: string | null; // External volume name, or null for local items
  added_at: string; // ISO 8601 timestamp
}

interface CollectionItemWithStatus extends CollectionItem {
  status: CollectionItemStatus;
}

type CollectionItemStatus =
  | "available"  // Path exists and is accessible
  | "missing"    // Local path doesn't exist (moved/deleted)
  | "offline";   // Path is on an unmounted external volume

interface AddCollectionItemInput {
  collection_id: number;
  path: string;
  item_type: "file" | "folder";
  volume_id?: string | null;
}
```

### Status Detection

The hook automatically detects the status of each item:
- **`available`**: Path exists and can be accessed
- **`missing`**: Path doesn't exist (local file/folder was moved or deleted)
- **`offline`**: Path is on an external volume that's not currently mounted

Status is computed each time items are loaded using the filesystem API.

### Global Relinking

**Critical Feature**: Relinking operations affect **ALL collections**, not just the current one.

When you call `relinkItem(oldPath, newPath)`:
- The system searches **all collections** for items with `oldPath`
- Updates them to `newPath` globally
- Refreshes the current collection's items

This ensures that if a file appears in multiple collections and you relink it once, it's updated everywhere.

### Examples

#### Adding Items

```typescript
const { addItem } = useCollectionItems(collectionId);

async function handleAddFile(filePath: string) {
  try {
    await addItem(collectionId, {
      path: filePath,
      item_type: "file",
      volume_id: null, // or "VolumeName" for external drives
    });
  } catch (error) {
    console.error("Failed to add:", error);
  }
}
```

#### Removing Items

```typescript
const { removeItem } = useCollectionItems(collectionId);

async function handleRemove(itemId: number) {
  try {
    await removeItem(itemId);
  } catch (error) {
    console.error("Failed to remove:", error);
  }
}
```

#### Relinking a Single Item

```typescript
const { relinkItem } = useCollectionItems(collectionId);

async function handleRelinkFile(oldPath: string, newPath: string) {
  try {
    const count = await relinkItem(oldPath, newPath);
    console.log(`Updated ${count} item(s) across all collections`);
  } catch (error) {
    console.error("Failed to relink:", error);
  }
}
```

#### Bulk Relinking a Folder

```typescript
const { relinkFolder } = useCollectionItems(collectionId);

async function handleRelinkFolder(oldFolderPath: string, newFolderPath: string) {
  try {
    const count = await relinkFolder(oldFolderPath, newFolderPath);
    console.log(`Updated ${count} item(s) within the folder across all collections`);
  } catch (error) {
    console.error("Failed to relink folder:", error);
  }
}
```

#### Displaying Status

```typescript
const { items } = useCollectionItems(collectionId);

return (
  <ul>
    {items.map((item) => (
      <li key={item.id}>
        {item.path}
        {item.status === "missing" && <span> ⚠️ Missing</span>}
        {item.status === "offline" && <span> 📴 Offline</span>}
      </li>
    ))}
  </ul>
);
```

---

## Best Practices

### Error Handling

Always handle errors from hook methods:

```typescript
try {
  await createCollection({ name: "My Collection" });
} catch (error) {
  // Show user-friendly error message
  alert(`Failed to create collection: ${error.message}`);
}
```

### Loading States

Use the `isLoading` state to provide feedback:

```typescript
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage message={error} />;
}

return <CollectionsList collections={collections} />;
```

### Optimistic Updates

For better UX, consider optimistic updates before the server confirms:

```typescript
// Show the new item immediately
setOptimisticItems([...items, newItem]);

try {
  await addItem(newItem);
  // Success - refetch will update with server data
} catch (error) {
  // Revert optimistic update
  setOptimisticItems(items);
  alert("Failed to add item");
}
```

### Relinking Strategy

For "Missing" items:
1. Detect the status using the automatically-provided `status` field
2. Prompt the user to select the new location
3. Call `relinkItem` to update globally
4. The hook will automatically refresh and show the updated status

For external volumes:
1. "Offline" status appears when volume is unmounted
2. Status automatically changes to "available" when volume is remounted (on next refetch)
3. No manual relinking needed for volume reconnections
