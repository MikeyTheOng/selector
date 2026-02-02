import { useCallback, useEffect, useMemo, useState } from "react";
import { homeDir, pictureDir } from "@tauri-apps/api/path";
import { readDir, watch } from "@tauri-apps/plugin-fs";
import { getErrorMessage, isHiddenName, resolveEntry } from "@/lib/path-utils";
import type { LocationItem } from "@/types/explorer";

type LocationsState = {
  favorites: LocationItem[];
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

    const loadLocations = async () => {
      try {
        const homePath = await homeDir();
        const picturesPath = await pictureDir();
        if (!isActive) return;

        const favorites: LocationItem[] = [
          {
            path: homePath,
            name: homePath.split("/").pop() ?? "Home",
            kind: "favorite",
          },
          {
            path: picturesPath,
            name: "Pictures",
            kind: "favorite",
          },
        ];

        let volumes: LocationItem[] = [];
        try {
          volumes = await readVolumes();
          console.log("Volumes:", volumes); // # DEBUG
        } catch {
          console.log("Volumes not found"); // # DEBUG
          volumes = [];
        }

        if (!isActive) return;

        setState({ favorites, volumes, error: null });
      } catch (error) {
        if (!isActive) return;
        setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
      }
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
