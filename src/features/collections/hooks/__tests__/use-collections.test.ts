import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCollections } from "../use-collections";
import * as collectionsService from "../../lib/collections-service";
import type { Collection } from "../../types";

// Mock the collections service
vi.mock("../../lib/collections-service");

describe("useCollections", () => {
  const mockCollections: Collection[] = [
    {
      id: 1,
      name: "Vacation 2024",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: 2,
      name: "Work Projects",
      created_at: "2024-01-14T09:00:00Z",
      updated_at: "2024-01-14T09:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state and loading", () => {
    it("should start with loading state", () => {
      vi.mocked(collectionsService.getCollections).mockImplementation(
        () => new Promise(() => { }) // Never resolves
      );

      const { result } = renderHook(() => useCollections());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.collections).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it("should load collections on mount", async () => {
      vi.mocked(collectionsService.getCollections).mockResolvedValue(
        mockCollections
      );

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.collections).toEqual(mockCollections);
      expect(result.current.error).toBe(null);
      expect(collectionsService.getCollections).toHaveBeenCalledTimes(1);
    });

    it("should handle errors when loading collections", async () => {
      const errorMessage = "Failed to load collections";
      vi.mocked(collectionsService.getCollections).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.collections).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("createCollection", () => {
    it("should create a new collection and refresh the list", async () => {
      const newCollection: Collection = {
        id: 3,
        name: "New Collection",
        created_at: "2024-01-16T12:00:00Z",
        updated_at: "2024-01-16T12:00:00Z",
      };

      vi.mocked(collectionsService.getCollections)
        .mockResolvedValueOnce(mockCollections)
        .mockResolvedValueOnce([newCollection, ...mockCollections]);

      vi.mocked(collectionsService.createCollection).mockResolvedValue(
        newCollection
      );

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createCollection({ name: "New Collection" });
      });

      expect(collectionsService.createCollection).toHaveBeenCalledWith({
        name: "New Collection",
      });
      expect(result.current.collections).toHaveLength(3);
      expect(result.current.collections[0].name).toBe("New Collection");
    });

    it("should handle errors when creating a collection", async () => {
      vi.mocked(collectionsService.getCollections).mockResolvedValue(
        mockCollections
      );
      vi.mocked(collectionsService.createCollection).mockRejectedValue(
        new Error("Collection name cannot be empty")
      );

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.createCollection({ name: "" })
      ).rejects.toThrow("Collection name cannot be empty");

      // Collections list should remain unchanged
      expect(result.current.collections).toEqual(mockCollections);
    });
  });

  describe("updateCollection", () => {
    it("should update a collection and refresh the list", async () => {
      const updatedCollection: Collection = {
        ...mockCollections[0],
        name: "Updated Vacation 2024",
        updated_at: "2024-01-16T13:00:00Z",
      };

      vi.mocked(collectionsService.getCollections)
        .mockResolvedValueOnce(mockCollections)
        .mockResolvedValueOnce([updatedCollection, mockCollections[1]]);

      vi.mocked(collectionsService.updateCollection).mockResolvedValue(
        updatedCollection
      );

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateCollection({
          id: 1,
          name: "Updated Vacation 2024",
        });
      });

      expect(collectionsService.updateCollection).toHaveBeenCalledWith({
        id: 1,
        name: "Updated Vacation 2024",
      });
      expect(result.current.collections[0].name).toBe("Updated Vacation 2024");
    });
  });

  describe("deleteCollection", () => {
    it("should delete a collection and refresh the list", async () => {
      vi.mocked(collectionsService.getCollections)
        .mockResolvedValueOnce(mockCollections)
        .mockResolvedValueOnce([mockCollections[1]]);

      vi.mocked(collectionsService.deleteCollection).mockResolvedValue();

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCollection(1);
      });

      expect(collectionsService.deleteCollection).toHaveBeenCalledWith(1);
      expect(result.current.collections).toHaveLength(1);
      expect(result.current.collections[0].id).toBe(2);
    });
  });

  describe("refetch", () => {
    it("should manually refetch collections", async () => {
      vi.mocked(collectionsService.getCollections)
        .mockResolvedValueOnce(mockCollections)
        .mockResolvedValueOnce([...mockCollections].reverse());

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.collections[0].id).toBe(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(collectionsService.getCollections).toHaveBeenCalledTimes(2);
      expect(result.current.collections[0].id).toBe(2);
    });
  });
});
