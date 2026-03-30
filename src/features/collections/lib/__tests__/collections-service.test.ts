import { describe, it, expect, beforeEach, vi } from "vitest";
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
  addItemsToCollection,
  removeItemFromCollection,
  getCollectionItems,
  updateItemPath,
  relinkFolderItems,
} from "../collections-service";
import { resetDatabaseCache } from "@/lib/tauri/database";
import { DuplicateItemError } from "../../errors";
import type { Collection, CollectionItem } from "../../types";

const getNonPragmaExecuteCalls = () =>
  mockDatabaseExecute.mock.calls.filter(
    ([sql]) => sql !== "PRAGMA foreign_keys = ON;",
  );

describe("collections-service", () => {
  beforeEach(() => {
    resetDatabaseCache();
    resetSqlMocks();
    vi.clearAllMocks();
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
        expect.arrayContaining(["My Collection"]),
      );
    });

    it("should throw an error if collection name is empty", async () => {
      await expect(createCollection({ name: "" })).rejects.toThrow(
        "Collection name cannot be empty",
      );
    });

    it("should throw an error if collection name is only whitespace", async () => {
      await expect(createCollection({ name: "   " })).rejects.toThrow(
        "Collection name cannot be empty",
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
        expect.stringContaining("SELECT * FROM collections"),
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
        [1],
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
        expect.arrayContaining(["Updated Name", 1]),
      );
    });

    it("should throw an error if collection name is empty", async () => {
      await expect(updateCollection({ id: 1, name: "" })).rejects.toThrow(
        "Collection name cannot be empty",
      );
    });
  });

  describe("deleteCollection", () => {
    it("should delete a collection by id", async () => {
      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 1 });

      await deleteCollection(1);

      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM collections"),
        [1],
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
        added_at: "2024-01-01T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });
      mockDatabaseSelect
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockItem]);

      const result = await addItemToCollection({
        collection_id: 1,
        path: "/Users/test/photos/image.jpg",
        item_type: "file",
      });

      expect(result).toEqual(mockItem);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO collection_items"),
        expect.arrayContaining([1, "/Users/test/photos/image.jpg", "file"]),
      );
    });

    it("should add an item from external volumes", async () => {
      const mockItem: CollectionItem = {
        id: 1,
        collection_id: 1,
        path: "/Volumes/External/photos/image.jpg",
        item_type: "file",
        added_at: "2024-01-01T00:00:00",
      };

      mockDatabaseSelect
        .mockResolvedValueOnce([]) // No duplicate check
        .mockResolvedValueOnce([mockItem]); // Return the created item
      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });

      const result = await addItemToCollection({
        collection_id: 1,
        path: "/Volumes/External/photos/image.jpg",
        item_type: "file",
      });

      expect(result).toEqual(mockItem);
      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO collection_items"),
        expect.arrayContaining([
          1,
          "/Volumes/External/photos/image.jpg",
          "file",
        ]),
      );
    });

    it("should throw DuplicateItemError when item already exists", async () => {
      const existingItem: CollectionItem = {
        id: 99,
        collection_id: 1,
        path: "/Users/test/photos/image.jpg",
        item_type: "file",
        added_at: "2024-01-01T00:00:00",
      };
      const mockCollection: Collection = {
        id: 1,
        name: "My Collection",
        created_at: "2024-01-01T00:00:00",
        updated_at: "2024-01-01T00:00:00",
      };

      mockDatabaseSelect
        .mockResolvedValueOnce([existingItem])
        .mockResolvedValueOnce([mockCollection]);

      await expect(
        addItemToCollection({
          collection_id: 1,
          path: "/Users/test/photos/image.jpg",
          item_type: "file",
        }),
      ).rejects.toThrow(DuplicateItemError);

      expect(getNonPragmaExecuteCalls()).toHaveLength(0);
    });
  });

  describe("addItemsToCollection", () => {
    it("should return successes and errors without aborting", async () => {
      const mockItem: CollectionItem = {
        id: 1,
        collection_id: 1,
        path: "/Users/test/photos/image.jpg",
        item_type: "file",
        added_at: "2024-01-01T00:00:00",
      };
      const existingItem: CollectionItem = {
        id: 2,
        collection_id: 1,
        path: "/Users/test/photos/duplicate.jpg",
        item_type: "file",
        added_at: "2024-01-01T00:00:00",
      };
      const mockCollection: Collection = {
        id: 1,
        name: "My Collection",
        created_at: "2024-01-01T00:00:00",
        updated_at: "2024-01-01T00:00:00",
      };

      mockDatabaseExecute.mockResolvedValueOnce({ lastInsertId: 1 });
      mockDatabaseSelect
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockItem])
        .mockResolvedValueOnce([existingItem])
        .mockResolvedValueOnce([mockCollection]);

      const result = await addItemsToCollection(1, [
        { path: mockItem.path, item_type: "file" },
        { path: existingItem.path, item_type: "file" },
      ]);

      expect(result.added).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBeInstanceOf(DuplicateItemError);
    });
  });

  describe("removeItemFromCollection", () => {
    it("should remove an item from a collection", async () => {
      mockDatabaseExecute.mockResolvedValueOnce({ rowsAffected: 1 });

      await removeItemFromCollection(1);

      expect(mockDatabaseExecute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM collection_items"),
        [1],
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
          added_at: "2024-01-01T00:00:00",
        },
        {
          id: 2,
          collection_id: 1,
          path: "/Users/test/photos/folder",
          item_type: "folder",
          added_at: "2024-01-01T00:00:00",
        },
      ];

      mockDatabaseSelect.mockResolvedValueOnce(mockItems);

      const result = await getCollectionItems(1);

      expect(result).toEqual(mockItems);
      expect(mockDatabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining("WHERE collection_id = ?"),
        [1],
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
      mockDatabaseExecute.mockResolvedValue({ rowsAffected: 3 });

      const result = await updateItemPath(
        "/old/path/file.jpg",
        "/new/path/file.jpg",
      );

      expect(result).toBe(3);
      expect(mockDatabaseExecute).toHaveBeenLastCalledWith(
        expect.stringContaining("UPDATE collection_items SET path = ?"),
        ["/new/path/file.jpg", "/old/path/file.jpg"],
      );
    });
  });

  describe("relinkFolderItems", () => {
    it("should update all items within a folder across all collections", async () => {
      const oldFolderPath = "/Volumes/OldDrive/Photos";
      const newFolderPath = "/Volumes/NewDrive/Photos";

      // Mock items that need relinking
      const itemsToRelink: CollectionItem[] = [
        {
          id: 1,
          collection_id: 1,
          path: "/Volumes/OldDrive/Photos/vacation/beach.jpg",
          item_type: "file",
          added_at: "2024-01-01T00:00:00",
        },
        {
          id: 2,
          collection_id: 2,
          path: "/Volumes/OldDrive/Photos/family/dinner.jpg",
          item_type: "file",
          added_at: "2024-01-01T00:00:00",
        },
        {
          id: 3,
          collection_id: 1,
          path: "/Volumes/OldDrive/Photos/work",
          item_type: "folder",
          added_at: "2024-01-01T00:00:00",
        },
      ];

      mockDatabaseSelect.mockResolvedValueOnce(itemsToRelink);
      mockDatabaseExecute.mockResolvedValue({ rowsAffected: 1 });

      const result = await relinkFolderItems(oldFolderPath, newFolderPath);

      expect(result).toBe(3); // 3 items relinked
      expect(mockDatabaseSelect).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT * FROM collection_items WHERE path LIKE ?",
        ),
        ["/Volumes/OldDrive/Photos%"],
      );

      // Should update each item
      expect(getNonPragmaExecuteCalls()).toHaveLength(3);
    });

    it("should handle folder relinking with trailing slashes", async () => {
      const oldFolderPath = "/Users/test/Documents/";
      const newFolderPath = "/Users/test/NewDocuments/";

      mockDatabaseSelect.mockResolvedValueOnce([
        {
          id: 1,
          collection_id: 1,
          path: "/Users/test/Documents/report.pdf",
          item_type: "file",
          added_at: "2024-01-01T00:00:00",
        },
      ]);
      mockDatabaseExecute.mockResolvedValue({ rowsAffected: 1 });

      const result = await relinkFolderItems(oldFolderPath, newFolderPath);

      expect(result).toBe(1);
    });

    it("should return 0 if no items match the folder path", async () => {
      mockDatabaseSelect.mockResolvedValueOnce([]);

      const result = await relinkFolderItems(
        "/nonexistent/folder",
        "/new/folder",
      );

      expect(result).toBe(0);
    });
  });
});
