import { describe, it, expect } from "vitest";
import { collectionItemToExplorerItem } from "../utils";
import type { CollectionItemWithStatus } from "../../types";

describe("collectionItemToExplorerItem", () => {
  it("should convert a collection item to an explorer item with correct properties", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 1,
      collection_id: 10,
      path: "/Users/test/photo.jpg",
      item_type: "file",
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.path).toBe("/Users/test/photo.jpg");
    expect(result.name).toBe("photo.jpg");
    expect(result.kind).toBe("file");
    expect(result.status).toBe("available");
    
    if (result.kind === 'file') {
      expect(result.extension).toBe("jpg");
      expect(result.kindLabel).toBe("File");
    } else {
      throw new Error("Expected result to be a file");
    }
  });

  it("should format dateModifiedLabel using formatDateTime (human-readable format)", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 1,
      collection_id: 10,
      path: "/Users/test/photo.jpg",
      item_type: "file",
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.dateModifiedLabel).toContain("at");
    expect(result.dateModifiedLabel).toContain("2024");
    expect(result.dateModifiedLabel).not.toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("should handle folders correctly", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 2,
      collection_id: 10,
      path: "/Users/test/documents",
      item_type: "folder",
      added_at: "2024-01-15T10:30:00Z",
      status: "available",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.kind).toBe("folder");
    
    if (result.kind === 'folder') {
      // Folder specific checks
    } else {
       throw new Error("Expected result to be a folder");
    }
  });

  it("should handle missing/offline status", () => {
    const collectionItem: CollectionItemWithStatus = {
      id: 3,
      collection_id: 10,
      path: "/Volumes/External/file.txt",
      item_type: "file",
      added_at: "2024-01-15T10:30:00Z",
      status: "offline",
    };

    const result = collectionItemToExplorerItem(collectionItem);

    expect(result.status).toBe("offline");
  });
});
