import { describe, it, expect } from "vitest";
import { collectionItemToExplorerItem } from "../use-collection-selection";
import type { CollectionItemWithStatus } from "../../types";

describe("collectionItemToExplorerItem", () => {
  it("should convert a collection item to an explorer item with correct properties", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 1,
      collection_id: 10,
      path: "/Users/test/photo.jpg",
      item_type: "file",
      volume_id: null,
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.id).toBe("/Users/test/photo.jpg");
    expect(result.path).toBe("/Users/test/photo.jpg");
    expect(result.name).toBe("photo.jpg");
    expect(result.kind).toBe("file");
    expect(result.status).toBe("available");
    expect(result.extension).toBe("jpg");
    expect(result.kindLabel).toBe("File");
  });

  it("should format dateModifiedLabel using formatDateTime (human-readable format)", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 1,
      collection_id: 10,
      path: "/Users/test/photo.jpg",
      item_type: "file",
      volume_id: null,
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    // formatDateTime produces strings like "15 Jan 2024 at 10:30 AM"
    // It should contain "at" and the year
    expect(result.dateModifiedLabel).toContain("at");
    expect(result.dateModifiedLabel).toContain("2024");
    // Should NOT be a simple locale date string like "1/15/2024"
    expect(result.dateModifiedLabel).not.toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("should handle folders correctly", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 2,
      collection_id: 10,
      path: "/Users/test/documents",
      item_type: "folder",
      volume_id: null,
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.kind).toBe("folder");
    expect(result.kindLabel).toBe("Folder");
    expect(result.extension).toBeUndefined();
  });

  it("should handle missing/offline status", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 3,
      collection_id: 10,
      path: "/Volumes/External/file.txt",
      item_type: "file",
      volume_id: "External",
      added_at: "2024-01-15T10:30:00Z",
      status: "offline",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.status).toBe("offline");
  });
});
