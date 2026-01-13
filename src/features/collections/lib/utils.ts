import { getPathBaseName } from "@/lib/path-utils";
import { formatDateTime } from "@/lib/formatters";
import type { ExplorerItem } from "@/types/explorer";
import type { CollectionItemWithStatus } from "../types";

/**
 * Converts a CollectionItem to an ExplorerItem
 */
export function collectionItemToExplorerItem(item: CollectionItemWithStatus): ExplorerItem {
  const name = getPathBaseName(item.path);
  const dateModified = new Date(item.added_at);
  const dateModifiedLabel = formatDateTime(dateModified);

  if (item.item_type === "folder") {
    return {
      path: item.path,
      name,
      kind: "folder",
      status: item.status,
      dateModified,
      dateModifiedLabel,
    };
  }

  return {
    path: item.path,
    name,
    kind: "file",
    status: item.status,
    dateModified,
    dateModifiedLabel,
    extension: name.split(".").pop() || "",
    kindLabel: "File",
    sizeLabel: "",
  };
}
