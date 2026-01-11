import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCollectionItems } from "../use-collection-items";
import * as collectionsService from "../../lib/collections-service";
import { DuplicateItemError } from "../../errors";

// Mock the collections service
vi.mock("../../lib/collections-service");

describe("useCollectionItems Duplicate Detection", () => {
  const mockCollectionId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getCollectionItems to return empty list
    vi.mocked(collectionsService.getCollectionItems).mockResolvedValue([]);
  });

  it("should throw DuplicateItemError when adding a duplicate item", async () => {
    vi.mocked(collectionsService.addItemToCollection).mockRejectedValue(
      new DuplicateItemError("Test Collection")
    );

    const { result } = renderHook(() => useCollectionItems(mockCollectionId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(async () => {
      await result.current.addItem(mockCollectionId, {
        path: "/path/to/duplicate.txt",
        item_type: "file",
      });
    }).rejects.toThrow(DuplicateItemError);
  });

  it("should throw DuplicateItemError when relinking to a duplicate path", async () => {
    vi.mocked(collectionsService.relinkItem).mockRejectedValue(
      new DuplicateItemError("Test Collection")
    );

    const { result } = renderHook(() => useCollectionItems(mockCollectionId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(async () => {
      await result.current.relinkItem("/old/path.txt", "/new/duplicate.txt");
    }).rejects.toThrow(DuplicateItemError);
  });
});
