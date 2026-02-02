import type { LocationItem } from "@/types/explorer";

export type FavoriteType = "home" | "pictures";

export interface FavoriteLocationItem extends LocationItem {
  kind: "favorite";
  favoriteType: FavoriteType;
}
