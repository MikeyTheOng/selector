import type { ExplorerItem } from "@/types/explorer";

export const detectAmbiguity = (items: ExplorerItem[]): { isAmbiguous: boolean } => {
  const hasFolder = items.some((item) => item.kind === "folder");
  return { isAmbiguous: hasFolder };
};
