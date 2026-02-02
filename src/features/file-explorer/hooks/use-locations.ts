import { isHiddenName, resolveEntry } from "@/lib/path-utils";
import type { LocationItem } from "@/types/explorer";
import { homeDir, pictureDir } from "@tauri-apps/api/path";
import { readDir, watch } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FavoriteLocationItem, FavoriteType } from "../types";

type LocationsState = {
  favorites: FavoriteLocationItem[];
  volumes: LocationItem[];
  error: string | null;
};

const readVolumes = async (): Promise<LocationItem[]> => {
  const volumeEntries = await readDir("/Volumes");
  return volumeEntries
    .filter((entry) => entry.isDirectory || entry.isSymlink)
    .map((entry) => resolveEntry(entry, "/Volumes"))
    .filter((entry): entry is { name: string; path: string } => Boolean(entry))
    .filter((entry) => !isHiddenName(entry.name))
    .map<LocationItem>((entry) => ({
      path: entry.path,
      name: entry.name,
      kind: "volume",
    }));
};

export const useLocations = () => {
  const [state, setState] = useState<LocationsState>({
    favorites: [],
    volumes: [],
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    const createFavorite = async (
      pathFn: () => Promise<string>,
      name: string,
      favoriteType: FavoriteType,
      displayName?: string,
    ): Promise<FavoriteLocationItem | null> => {
      try {
        const resolvedPath = await pathFn();
        return {
          path: resolvedPath,
          name: displayName ?? resolvedPath.split("/").pop() ?? name,
          kind: "favorite",
          favoriteType,
        };
      } catch (error) {
        console.error(`Failed to resolve ${name} path:`, error);
        return null;
      }
    };

    const loadLocations = async () => {
      const favoriteResults = await Promise.all([
        createFavorite(homeDir, "Home", "home"),
        createFavorite(pictureDir, "Pictures", "pictures", "Pictures"),
      ]);
      const favorites = favoriteResults.filter(
        (f): f is FavoriteLocationItem => f !== null,
      );

      if (!isActive) return;

      let volumes: LocationItem[] = [];
      try {
        volumes = await readVolumes();
      } catch {
        volumes = [];
      }

      if (!isActive) return;

      setState({ favorites, volumes, error: null });
    };

    loadLocations();

    return () => {
      isActive = false;
    };
  }, []);

  const refreshVolumes = useCallback(async () => {
    try {
      const volumes = await readVolumes();
      setState((prev) => ({ ...prev, volumes }));
    } catch (error) {
      console.error("Failed to refresh /Volumes", error);
    }
  }, []);

  // Watch /Volumes for live updates
  useEffect(() => {
    let isActive = true;
    let stopWatcher: (() => void) | null = null;

    const startWatcher = async () => {
      try {
        const stop = await watch(
          "/Volumes",
          () => {
            if (!isActive) return;
            void refreshVolumes();
          },
          { recursive: false, delayMs: 500 },
        );

        if (!isActive) {
          stop();
          return;
        }

        stopWatcher = stop;
      } catch (error) {
        if (isActive) {
          console.warn("Failed to watch /Volumes", error);
        }
      }
    };

    void startWatcher();

    return () => {
      isActive = false;
      stopWatcher?.();
    };
  }, [refreshVolumes]);

  const rootLocations = useMemo(
    () => [...state.favorites, ...state.volumes],
    [state.favorites, state.volumes],
  );

  return {
    favorites: state.favorites,
    volumes: state.volumes,
    rootLocations,
    error: state.error,
  };
};
