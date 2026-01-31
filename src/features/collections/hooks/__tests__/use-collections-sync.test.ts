import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCollections } from "../use-collections";
import * as collectionsService from "../../lib/collections-service";
import type { Collection } from "../../types";

// Mock the collections service
vi.mock("../../lib/collections-service");

describe("useCollections Synchronization", () => {
  const mockCollections: Collection[] = [
    {
      id: 1,
      name: "Coll 1",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update all hook instances when a collection is created in one", async () => {
    const newCollection: Collection = {
      id: 2,
      name: "Coll 2",
      created_at: "2024-01-16T12:00:00Z",
      updated_at: "2024-01-16T12:00:00Z",
    };

    vi.mocked(collectionsService.getCollections)
      .mockResolvedValueOnce(mockCollections) // Hook 1 mount
      .mockResolvedValueOnce(mockCollections) // Hook 2 mount
      .mockResolvedValue([newCollection, ...mockCollections]); // Subsequent calls

    vi.mocked(collectionsService.createCollection).mockResolvedValue(
      newCollection,
    );

    // Render two instances of the hook
    const hook1 = renderHook(() => useCollections());
    const hook2 = renderHook(() => useCollections());

    // Wait for initial load
    await waitFor(() => {
      expect(hook1.result.current.isLoading).toBe(false);
      expect(hook2.result.current.isLoading).toBe(false);
    });

    // Create collection in hook1
    await act(async () => {
      await hook1.result.current.createCollection({ name: "Coll 2" });
    });

    // Check if hook2 updated
    await waitFor(() => {
      expect(hook2.result.current.collections).toHaveLength(2);
    });

    expect(hook2.result.current.collections[0].name).toBe("Coll 2");
  });
});
