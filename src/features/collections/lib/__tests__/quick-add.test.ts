import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { ExplorerItem } from "@/types/explorer";
import {
  NO_REMEMBERED_COLLECTION_MESSAGE,
  quickAddToRememberedCollection,
} from "../quick-add";
import { REMEMBERED_COLLECTION_STORAGE_KEY } from "../storage";
import * as collectionsService from "../collections-service";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../collections-service", () => ({
  addItemsToCollection: vi.fn(),
  getCollectionById: vi.fn(),
}));

const entries: ExplorerItem[] = [
  {
    path: "/test/file1.txt",
    name: "file1.txt",
    kind: "file",
    extension: "txt",
    kindLabel: "Text",
    size: 1024,
    sizeLabel: "1024 B",
    dateModified: new Date(),
    dateModifiedLabel: "",
    status: "available",
  },
];

describe("quickAddToRememberedCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows a toast when no remembered collection exists", async () => {
    await quickAddToRememberedCollection(entries);

    expect(toast.error).toHaveBeenCalledWith(
      NO_REMEMBERED_COLLECTION_MESSAGE,
    );
    expect(collectionsService.getCollectionById).not.toHaveBeenCalled();
  });

  it("clears stale remembered collections and shows the same toast", async () => {
    localStorage.setItem(REMEMBERED_COLLECTION_STORAGE_KEY, "99");
    vi.mocked(collectionsService.getCollectionById).mockResolvedValue(null);

    await quickAddToRememberedCollection(entries);

    expect(collectionsService.getCollectionById).toHaveBeenCalledWith(99);
    expect(localStorage.getItem(REMEMBERED_COLLECTION_STORAGE_KEY)).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      NO_REMEMBERED_COLLECTION_MESSAGE,
    );
  });

  it("adds items to the remembered collection when it is valid", async () => {
    localStorage.setItem(REMEMBERED_COLLECTION_STORAGE_KEY, "5");
    vi.mocked(collectionsService.getCollectionById).mockResolvedValue({
      id: 5,
      name: "Inbox",
      created_at: "2024-01-01T00:00:00",
      updated_at: "2024-01-01T00:00:00",
    });
    vi.mocked(collectionsService.addItemsToCollection).mockResolvedValue({
      added: [],
      errors: [],
    });

    await quickAddToRememberedCollection(entries);

    expect(collectionsService.addItemsToCollection).toHaveBeenCalledWith(
      5,
      [
        {
          path: "/test/file1.txt",
          item_type: "file",
        },
      ],
    );
  });
});
