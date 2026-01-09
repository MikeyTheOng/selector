import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCollectionItems } from "../use-collection-items";
import * as collectionsService from "../../lib/collections-repository";
import { DuplicateItemError } from "../../errors";

// Mock the collections service
vi.mock("../../lib/collections-repository");

describe("useCollectionItems Duplicate Detection", () => {
  const mockCollectionId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getCollectionItems to return empty list
    vi.mocked(collectionsService.getCollectionItems).mockResolvedValue([]);
  });

  it("should throw DuplicateItemError when adding a duplicate item", async () => {
    // Mock getItemByPath to return an existing item (simulating duplicate)
    vi.mocked(collectionsService.getItemByPath).mockResolvedValue({
      id: 99,
      collection_id: mockCollectionId,
      path: "/path/to/duplicate.txt",
      item_type: "file",
      volume_id: null,
      added_at: ""
    });

    vi.mocked(collectionsService.getCollectionById).mockResolvedValue({
      id: mockCollectionId,
      name: "Test Collection",
      created_at: "",
      updated_at: ""
    });

    const { result } = renderHook(() => useCollectionItems(mockCollectionId));

    await expect(async () => {
      await result.current.addItem(mockCollectionId, {
        path: "/path/to/duplicate.txt",
        item_type: "file",
      });
    }).rejects.toThrow(DuplicateItemError);
  });

  it("should throw DuplicateItemError when relinking to a duplicate path", async () => {
    // Mock getItemByPath to return an existing item (simulating duplicate)
    vi.mocked(collectionsService.getItemByPath).mockResolvedValue({
      id: 99,
      collection_id: mockCollectionId,
      path: "/new/duplicate.txt",
      item_type: "file",
      volume_id: null,
      added_at: ""
    });

    vi.mocked(collectionsService.getCollectionById).mockResolvedValue({
      id: mockCollectionId,
      name: "Test Collection",
      created_at: "",
      updated_at: ""
    });

    const { result } = renderHook(() => useCollectionItems(mockCollectionId));

    await expect(async () => {
      await result.current.relinkItem("/old/path.txt", "/new/duplicate.txt");
    }).rejects.toThrow(DuplicateItemError);
  });
});
