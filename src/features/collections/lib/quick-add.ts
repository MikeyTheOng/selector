import { toast } from "sonner";
import type { ExplorerItem } from "@/types/explorer";
import {
  addItemsToCollection,
  getCollectionById,
} from "./collections-service";
import {
  clearLastUsedCollectionId,
  getLastUsedCollectionId,
} from "./storage";
import { DuplicateItemError } from "../errors";

export const NO_REMEMBERED_COLLECTION_MESSAGE =
  "No previously used collection found.";

function getFilename(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function toCollectionInputs(entries: ExplorerItem[]) {
  return entries.map((entry) => ({
    path: entry.path,
    item_type: entry.kind === "folder" ? ("folder" as const) : ("file" as const),
  }));
}

async function addEntriesToCollection(
  targetCollectionId: number,
  entries: ExplorerItem[],
): Promise<void> {
  const { added, errors } = await addItemsToCollection(
    targetCollectionId,
    toCollectionInputs(entries),
  );

  const duplicateCount = errors.filter(
    ({ error }) => error instanceof DuplicateItemError,
  ).length;
  const failureCount = errors.length - duplicateCount;

  for (const { input, error } of errors) {
    let errorMsg = "Failed to add item.";
    if (error instanceof DuplicateItemError) {
      const filename = getFilename(input.path);
      errorMsg = `'${filename}' is already in '${error.collectionName || "this collection"}'`;
    }
    toast.error(errorMsg);
  }

  if (added.length > 0) {
    const targetCollection = await getCollectionById(targetCollectionId);
    const summaryParts: string[] = [];

    if (duplicateCount > 0) {
      summaryParts.push(
        `skipped ${duplicateCount} duplicate${duplicateCount !== 1 ? "s" : ""}`,
      );
    }

    if (failureCount > 0) {
      summaryParts.push(
        `failed to add ${failureCount} item${failureCount !== 1 ? "s" : ""}`,
      );
    }

    const summarySuffix =
      summaryParts.length > 0 ? ` (${summaryParts.join(", ")})` : "";

    toast.success(
      `Added ${added.length} item${added.length !== 1 ? "s" : ""} to '${targetCollection?.name || "collection"}'${summarySuffix}`,
    );
  }
}

export async function quickAddToRememberedCollection(
  entries: ExplorerItem[],
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const rememberedCollectionId = getLastUsedCollectionId();
  if (rememberedCollectionId === null) {
    toast.error(NO_REMEMBERED_COLLECTION_MESSAGE);
    return;
  }

  const rememberedCollection = await getCollectionById(rememberedCollectionId);
  if (!rememberedCollection) {
    clearLastUsedCollectionId();
    toast.error(NO_REMEMBERED_COLLECTION_MESSAGE);
    return;
  }

  await addEntriesToCollection(rememberedCollection.id, entries);
}
