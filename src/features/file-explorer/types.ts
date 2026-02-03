import type { ExplorerItemStatus, LocationItem } from "@/types/explorer";

export type FavoriteType = "home" | "pictures" | "custom";

export interface FavoriteLocationItem extends LocationItem {
  kind: "favorite";
  favoriteType: FavoriteType;
  status: ExplorerItemStatus;
}
