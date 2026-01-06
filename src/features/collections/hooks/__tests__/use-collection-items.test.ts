import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCollectionItems } from "../use-collection-items";
import * as collectionsService from "../../lib/collections-repository";
import { fsModule } from "@/lib/tauri/fs";
import type { CollectionItem } from "../../types";

// Mock the collections service
vi.mock("../../lib/collections-service");

// Mock the fsModule for status detection
vi.mock("@/lib/tauri/fs", () => ({
  fsModule: {
    stat: vi.fn(),
  },
}));

describe("useCollectionItems", () => {
  const mockCollectionId = 1;
  const mockItems: CollectionItem[] = [
    {
      id: 1,
      collection_id: mockCollectionId,
      path: "/Users/test/photo1.jpg",
      item_type: "file",
      volume_id: null,
      added_at: "2024-01-15T10:00:00Z",
    },
    {
      id: 2,
      collection_id: mockCollectionId,
      path: "/Volumes/ExternalDrive/video.mp4",
      item_type: "file",
      volume_id: "ExternalDrive",
      added_at: "2024-01-15T11:00:00Z",
    },
    {
      id: 3,
      collection_id: mockCollectionId,
      path: "/Users/test/documents",
      item_type: "folder",
      volume_id: null,
      added_at: "2024-01-15T12:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state and loading", () => {
    it("should start with loading state", () => {
      vi.mocked(collectionsService.getCollectionItems).mockImplementation(
        () => new Promise(() => { }) // Never resolves
      );

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.items).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it("should load collection items on mount", async () => {
      vi.mocked(collectionsService.getCollectionItems).mockResolvedValue(
        mockItems
      );

      // Mock fsModule.stat to return success for all items (status: available)
      vi.mocked(fsModule.stat!).mockResolvedValue({
        size: 1024,
        mtime: new Date(),
      });

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(mockItems.length);
      expect(result.current.items[0]).toHaveProperty("status", "available");
      expect(result.current.error).toBe(null);
      expect(collectionsService.getCollectionItems).toHaveBeenCalledWith(
        mockCollectionId
      );
    });

    it("should handle errors when loading items", async () => {
      const errorMessage = "Failed to load collection items";
      vi.mocked(collectionsService.getCollectionItems).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it("should reload items when collection ID changes", async () => {
      vi.mocked(collectionsService.getCollectionItems)
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce([mockItems[0]]);

      const { result, rerender } = renderHook(
        ({ collectionId }) => useCollectionItems(collectionId),
        { initialProps: { collectionId: 1 } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(3);

      // Change collection ID
      rerender({ collectionId: 2 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(collectionsService.getCollectionItems).toHaveBeenCalledTimes(2);
      expect(collectionsService.getCollectionItems).toHaveBeenLastCalledWith(2);
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe("addItem", () => {
    it("should add a new item and refresh the list", async () => {
      const newItem: CollectionItem = {
        id: 4,
        collection_id: mockCollectionId,
        path: "/Users/test/newfile.txt",
        item_type: "file",
        volume_id: null,
        added_at: "2024-01-16T10:00:00Z",
      };

      vi.mocked(collectionsService.getCollectionItems)
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce([newItem, ...mockItems]);

      vi.mocked(collectionsService.addItemToCollection).mockResolvedValue(
        newItem
      );

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addItem({
          collection_id: mockCollectionId,
          path: "/Users/test/newfile.txt",
          item_type: "file",
        });
      });

      expect(collectionsService.addItemToCollection).toHaveBeenCalledWith({
        collection_id: mockCollectionId,
        path: "/Users/test/newfile.txt",
        item_type: "file",
      });
      expect(result.current.items).toHaveLength(4);
    });

    it("should handle errors when adding an item", async () => {
      vi.mocked(collectionsService.getCollectionItems).mockResolvedValue(
        mockItems
      );
      vi.mocked(collectionsService.addItemToCollection).mockRejectedValue(
        new Error("Duplicate item")
      );

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.addItem({
          collection_id: mockCollectionId,
          path: "/Users/test/photo1.jpg",
          item_type: "file",
        })
      ).rejects.toThrow("Duplicate item");

      // Items list should remain unchanged (with status fields)
      expect(result.current.items).toHaveLength(mockItems.length);
      expect(result.current.items[0].id).toBe(mockItems[0].id);
    });
  });

  describe("removeItem", () => {
    it("should remove an item and refresh the list", async () => {
      vi.mocked(collectionsService.getCollectionItems)
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce([mockItems[0], mockItems[2]]);

      vi.mocked(collectionsService.removeItemFromCollection).mockResolvedValue();

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(3);

      await act(async () => {
        await result.current.removeItem(2);
      });

      expect(collectionsService.removeItemFromCollection).toHaveBeenCalledWith(
        2
      );
      expect(result.current.items).toHaveLength(2);
    });
  });

  describe("refetch", () => {
    it("should manually refetch items", async () => {
      vi.mocked(collectionsService.getCollectionItems)
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce([mockItems[0]]);

      const { result } = renderHook(() =>
        useCollectionItems(mockCollectionId)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(3);

      await act(async () => {
        await result.current.refetch();
      });

      expect(collectionsService.getCollectionItems).toHaveBeenCalledTimes(2);
      expect(result.current.items).toHaveLength(1);
    });
  });
});
