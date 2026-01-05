import { describe, it, expect, beforeEach } from "vitest";
import {
  mockDatabaseExecute,
  mockDatabaseSelect,
  resetSqlMocks,
} from "@/test/mocks/tauri";
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  getCollectionItems,
  updateItemPath,
} from "../collections-service";
import { resetDatabaseCache } from "@/lib/tauri/database";
import type { Collection, CollectionItem } from "../../types";

describe("collections-service", () => {
  beforeEach(() => {
    resetDatabaseCache();
    resetSqlMocks();
  });

  describe("createCollection", () => {
    it("should create a new collection and return it", async () => {
      const mockCollection: Collection = {
        id: 1,
        name: "My Collection",
        created_at: "2024-01-01T00:00:00",
        updated_at: "2024-01-01T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });
      mockDatabaseSelect.mockResolvedValueOnce([mockCollection]);

      const result = await createCollection({ name: "My Collection" });

      expect(result).toEqual(mockCollection);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO collections"),
        expect.arrayContaining(["My Collection"])
      );
    });

    it("should throw an error if collection name is empty", async () => {
      await expect(createCollection({ name: "" })).rejects.toThrow(
        "Collection name cannot be empty"
      );
    });

    it("should throw an error if collection name is only whitespace", async () => {
      await expect(createCollection({ name: "   " })).rejects.toThrow(
        "Collection name cannot be empty"
      );
    });
  });

  describe("getCollections", () => {
    it("should return all collections", async () => {
      const mockCollections: Collection[] = [
        {
          id: 1,
          name: "Collection 1",
          created_at: "2024-01-01T00:00:00",
          updated_at: "2024-01-01T00:00:00",
        },
        {
          id: 2,
          name: "Collection 2",
          created_at: "2024-01-02T00:00:00",
          updated_at: "2024-01-02T00:00:00",
        },
      ];

      mockDatabaseSelect.mockResolvedValueOnce(mockCollections);

      const result = await getCollections();

      expect(result).toEqual(mockCollections);
      expect(mockDatabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM collections")
      );
    });

    it("should return an empty array if no collections exist", async () => {
      mockDatabaseSelect.mockResolvedValueOnce([]);

      const result = await getCollections();

      expect(result).toEqual([]);
    });
  });

  describe("getCollectionById", () => {
    it("should return a collection by id", async () => {
      const mockCollection: Collection = {
        id: 1,
        name: "My Collection",
        created_at: "2024-01-01T00:00:00",
        updated_at: "2024-01-01T00:00:00",
      };

      mockDatabaseSelect.mockResolvedValueOnce([mockCollection]);

      const result = await getCollectionById(1);

      expect(result).toEqual(mockCollection);
      expect(mockDatabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = ?"),
        [1]
      );
    });

    it("should return null if collection is not found", async () => {
      mockDatabaseSelect.mockResolvedValueOnce([]);

      const result = await getCollectionById(999);

      expect(result).toBeNull();
    });
  });

  describe("updateCollection", () => {
    it("should update a collection name", async () => {
      const updatedCollection: Collection = {
        id: 1,
        name: "Updated Name",
        created_at: "2024-01-01T00:00:00",
        updated_at: "2024-01-02T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 1 });
      mockDatabaseSelect.mockResolvedValueOnce([updatedCollection]);

      const result = await updateCollection({ id: 1, name: "Updated Name" });

      expect(result).toEqual(updatedCollection);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE collections"),
        expect.arrayContaining(["Updated Name", 1])
      );
    });

    it("should throw an error if collection name is empty", async () => {
      await expect(updateCollection({ id: 1, name: "" })).rejects.toThrow(
        "Collection name cannot be empty"
      );
    });
  });

  describe("deleteCollection", () => {
    it("should delete a collection by id", async () => {
      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 1 });

      await deleteCollection(1);

      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM collections"),
        [1]
      );
    });
  });

  describe("addItemToCollection", () => {
    it("should add an item to a collection", async () => {
      const mockItem: CollectionItem = {
        id: 1,
        collection_id: 1,
        path: "/Users/test/photos/image.jpg",
        item_type: "file",
        volume_id: null,
        added_at: "2024-01-01T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });
      mockDatabaseSelect.mockResolvedValueOnce([mockItem]);

      const result = await addItemToCollection({
        collection_id: 1,
        path: "/Users/test/photos/image.jpg",
        item_type: "file",
      });

      expect(result).toEqual(mockItem);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO collection_items"),
        expect.arrayContaining([1, "/Users/test/photos/image.jpg", "file"])
      );
    });

    it("should add an item with volume_id for external volumes", async () => {
      const mockItem: CollectionItem = {
        id: 1,
        collection_id: 1,
        path: "/Volumes/External/photos/image.jpg",
        item_type: "file",
        volume_id: "External",
        added_at: "2024-01-01T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });
      mockDatabaseSelect.mockResolvedValueOnce([mockItem]);

      const result = await addItemToCollection({
        collection_id: 1,
        path: "/Volumes/External/photos/image.jpg",
        item_type: "file",
        volume_id: "External",
      });

      expect(result).toEqual(mockItem);
    });
  });

  describe("removeItemFromCollection", () => {
    it("should remove an item from a collection", async () => {
      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 1 });

      await removeItemFromCollection(1);

      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM collection_items"),
        [1]
      );
    });
  });

  describe("getCollectionItems", () => {
    it("should return all items in a collection", async () => {
      const mockItems: CollectionItem[] = [
        {
          id: 1,
          collection_id: 1,
          path: "/Users/test/photos/image1.jpg",
          item_type: "file",
          volume_id: null,
          added_at: "2024-01-01T00:00:00",
        },
        {
          id: 2,
          collection_id: 1,
          path: "/Users/test/photos/folder",
          item_type: "folder",
          volume_id: null,
          added_at: "2024-01-01T00:00:00",
        },
      ];

      mockDatabaseSelect.mockResolvedValueOnce(mockItems);

      const result = await getCollectionItems(1);

      expect(result).toEqual(mockItems);
      expect(mockDatabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining("WHERE collection_id = ?"),
        [1]
      );
    });

    it("should return an empty array if collection has no items", async () => {
      mockDatabaseSelect.mockResolvedValueOnce([]);

      const result = await getCollectionItems(1);

      expect(result).toEqual([]);
    });
  });

  describe("updateItemPath", () => {
    it("should update the path for an item across all collections", async () => {
      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 3 });

      const result = await updateItemPath(
        "/old/path/file.jpg",
        "/new/path/file.jpg"
      );

      expect(result).toBe(3);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE collection_items SET path = ?"),
        ["/new/path/file.jpg", "/old/path/file.jpg"]
      );
    });
  });
});
