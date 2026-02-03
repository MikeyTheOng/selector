import { stat } from "@tauri-apps/plugin-fs";
import type { ExplorerItemStatus } from "@/types/explorer";
import { getPathBaseName } from "@/lib/path-utils";
import type { FavoriteLocationItem } from "../types";
import { getFavoriteLocations } from "../data/favorite-locations-repository";

export const normalizeFavoritePath = (path: string): string => {
  if (!path) return "";
  let normalized = path.trim();
  if (!normalized) return "";
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return normalized;
};

export const detectFavoriteStatus = async (path: string): Promise<ExplorerItemStatus> => {
  if (!path) {
    return "missing";
  }

  try {
    await stat(path);
    return "available";
  } catch {
    if (path.startsWith("/Volumes/")) {
      const segments = path.split("/").filter(Boolean);
      const volumeName = segments[1];
      if (!volumeName) {
        return "missing";
      }

      const volumeRoot = `/Volumes/${volumeName}`;
      try {
        await stat(volumeRoot);
        return "missing";
      } catch {
        return "offline";
      }
    }

    return "missing";
  }
};

export const getUserFavorites = async (): Promise<FavoriteLocationItem[]> => {
  const rows = await getFavoriteLocations();
  const seen = new Set<string>();
  const favorites: FavoriteLocationItem[] = [];

  for (const row of rows) {
    const normalized = normalizeFavoritePath(row.path);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    const status = await detectFavoriteStatus(normalized);
    favorites.push({
      path: normalized,
      name: getPathBaseName(normalized),
      kind: "favorite",
      favoriteType: "custom",
      status,
    });
  }

  return favorites;
};
