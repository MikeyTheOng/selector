import { isHiddenName, resolveEntry, getPathBaseName } from "@/lib/path-utils";
import type { LocationItem } from "@/types/explorer";
import { homeDir, pictureDir } from "@tauri-apps/api/path";
import { readDir, watch } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FavoriteLocationItem, FavoriteType } from "../types";
import {
  detectFavoriteStatus,
  getUserFavorites,
  normalizeFavoritePath,
} from "../lib/favorites-service";
import {
  addFavoriteLocation,
  removeFavoriteLocation,
} from "../data/favorite-locations-repository";

type LocationsState = {
  favorites: FavoriteLocationItem[];
  volumes: LocationItem[];
  error: string | null;
};

const FAVORITE_REFRESH_INTERVAL_MS = 5000;

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
  const isActiveRef = useRef(true);
  const builtInPathsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const buildFavorites = useCallback(async (): Promise<FavoriteLocationItem[]> => {
    const builtInPaths = new Set<string>();

    const createFavorite = async (
      pathFn: () => Promise<string>,
      name: string,
      favoriteType: FavoriteType,
      displayName?: string,
    ): Promise<FavoriteLocationItem | null> => {
      try {
        const resolvedPath = await pathFn();
        const normalizedPath = normalizeFavoritePath(resolvedPath);
        if (!normalizedPath) {
          return null;
        }
        const status = await detectFavoriteStatus(normalizedPath);
        builtInPaths.add(normalizedPath);
        return {
          path: normalizedPath,
          name: displayName ?? getPathBaseName(normalizedPath) ?? name,
          kind: "favorite",
          favoriteType,
          status,
        };
      } catch (error) {
        console.error(`Failed to resolve ${name} path:`, error);
        return null;
      }
    };

    const favoriteResults = await Promise.all([
      createFavorite(homeDir, "Home", "home"),
      createFavorite(pictureDir, "Pictures", "pictures", "Pictures"),
    ]);
    const builtInFavorites = favoriteResults.filter(
      (f): f is FavoriteLocationItem => f !== null,
    );
    const customFavorites = await getUserFavorites();

    const mergedFavorites: FavoriteLocationItem[] = [];
    const seen = new Set<string>();
    const addFavorite = (favorite: FavoriteLocationItem) => {
      const normalized = normalizeFavoritePath(favorite.path);
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      mergedFavorites.push({ ...favorite, path: normalized });
    };

    builtInFavorites.forEach(addFavorite);
    customFavorites.forEach(addFavorite);
    builtInPathsRef.current = builtInPaths;

    return mergedFavorites;
  }, []);

  const refreshFavorites = useCallback(async () => {
    const favorites = await buildFavorites();
    if (!isActiveRef.current) {
      return favorites;
    }
    setState((prev) => ({ ...prev, favorites }));
    return favorites;
  }, [buildFavorites]);

  const refreshVolumes = useCallback(async () => {
    try {
      const volumes = await readVolumes();
      if (!isActiveRef.current) {
        return;
      }
      setState((prev) => ({ ...prev, volumes }));
    } catch (error) {
      console.error("Failed to refresh /Volumes", error);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadLocations = async () => {
      const [favorites, volumes] = await Promise.all([
        buildFavorites(),
        readVolumes().catch(() => [] as LocationItem[]),
      ]);

      if (!isActive) return;

      setState({ favorites, volumes, error: null });
    };

    loadLocations();

    return () => {
      isActive = false;
    };
  }, [buildFavorites]);

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
            void refreshFavorites();
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
  }, [refreshFavorites, refreshVolumes]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void refreshFavorites();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshFavorites();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshFavorites]);

  useEffect(() => {
    if (!state.favorites.some((favorite) => favorite.status !== "available")) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshFavorites();
    }, FAVORITE_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshFavorites, state.favorites]);

  const isBuiltInPath = useCallback(async (normalizedPath: string) => {
    if (builtInPathsRef.current.size > 0) {
      return builtInPathsRef.current.has(normalizedPath);
    }

    try {
      const [homePath, picturesPath] = await Promise.all([homeDir(), pictureDir()]);
      const normalizedHome = normalizeFavoritePath(homePath);
      const normalizedPictures = normalizeFavoritePath(picturesPath);
      return normalizedPath === normalizedHome || normalizedPath === normalizedPictures;
    } catch {
      return false;
    }
  }, []);

  const applyFavoriteUpdate = useCallback(
    async (path: string, action: "add" | "remove") => {
      const normalizedPath = normalizeFavoritePath(path);
      if (!normalizedPath) {
        return;
      }

      setState((prev) => {
        if (action === "remove") {
          return {
            ...prev,
            favorites: prev.favorites.filter((favorite) => favorite.path !== normalizedPath),
          };
        }

        if (prev.favorites.some((favorite) => favorite.path === normalizedPath)) {
          return prev;
        }

        const optimisticFavorite: FavoriteLocationItem = {
          path: normalizedPath,
          name: getPathBaseName(normalizedPath),
          kind: "favorite",
          favoriteType: "custom",
          status: "available",
        };

        return {
          ...prev,
          favorites: [...prev.favorites, optimisticFavorite],
        };
      });

      if (action === "add") {
        const status = await detectFavoriteStatus(normalizedPath);
        setState((prev) => {
          let didUpdate = false;
          const favorites = prev.favorites.map((favorite) => {
            if (favorite.path !== normalizedPath) {
              return favorite;
            }
            if (favorite.status === status) {
              return favorite;
            }
            didUpdate = true;
            return { ...favorite, status };
          });

          return didUpdate ? { ...prev, favorites } : prev;
        });
      }
    },
    [],
  );

  const addFavorite = useCallback(
    async (path: string) => {
      const normalizedPath = normalizeFavoritePath(path);
      if (!normalizedPath) return;

      if (await isBuiltInPath(normalizedPath)) {
        return;
      }

      const wasAlreadyFavorite = state.favorites.some(
        (favorite) => favorite.path === normalizedPath,
      );

      void applyFavoriteUpdate(normalizedPath, "add");

      try {
        await addFavoriteLocation(normalizedPath);
      } catch (error) {
        console.error("Failed to add favorite:", error);
        if (!wasAlreadyFavorite) {
          void applyFavoriteUpdate(normalizedPath, "remove");
        }
        throw error;
      } finally {
        await refreshFavorites();
      }
    },
    [applyFavoriteUpdate, isBuiltInPath, refreshFavorites, state.favorites],
  );

  const removeFavorite = useCallback(
    async (path: string) => {
      const normalizedPath = normalizeFavoritePath(path);
      if (!normalizedPath) return;

      const removedFavoriteIndex = state.favorites.findIndex(
        (favorite) => favorite.path === normalizedPath,
      );
      const removedFavorite =
        removedFavoriteIndex >= 0 ? state.favorites[removedFavoriteIndex] : undefined;

      void applyFavoriteUpdate(normalizedPath, "remove");

      try {
        await removeFavoriteLocation(normalizedPath);
      } catch (error) {
        console.error("Failed to remove favorite:", error);
        if (removedFavorite) {
          setState((prev) => {
            if (prev.favorites.some((favorite) => favorite.path === normalizedPath)) {
              return prev;
            }

            const favorites = [...prev.favorites];
            const insertAt =
              removedFavoriteIndex >= 0 && removedFavoriteIndex <= favorites.length
                ? removedFavoriteIndex
                : favorites.length;
            favorites.splice(insertAt, 0, removedFavorite);
            return { ...prev, favorites };
          });
        }
        throw error;
      } finally {
        await refreshFavorites();
      }
    },
    [applyFavoriteUpdate, refreshFavorites, state.favorites],
  );

  const rootLocations = useMemo(
    () => [...state.favorites, ...state.volumes],
    [state.favorites, state.volumes],
  );

  return {
    favorites: state.favorites,
    volumes: state.volumes,
    rootLocations,
    error: state.error,
    addFavorite,
    removeFavorite,
  };
};
