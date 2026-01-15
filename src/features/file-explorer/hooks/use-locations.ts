import { useEffect, useState } from "react";
import { homeDir } from "@tauri-apps/api/path";
import { fsModule } from "@/lib/tauri/fs";
import { getErrorMessage, getPathBaseName, isHiddenName, resolveEntry } from "@/lib/path-utils";
import type { LocationItem } from "@/types/explorer";

type LocationsState = {
  locations: LocationItem[];
  error: string | null;
  homePath: string | null;
};

export const useLocations = () => {
  const [state, setState] = useState<LocationsState>({
    locations: [],
    error: null,
    homePath: null,
  });

  useEffect(() => {
    let isActive = true;

    const loadRoots = async () => {
      try {
        const homePath = await homeDir();
        if (!isActive) {
          return;
        }

        const homeLabel = getPathBaseName(homePath) || "Home";
        let locationRoots: LocationItem[] = [];

        try {
          const volumeEntries = await fsModule.readDir("/Volumes", { recursive: false });
          locationRoots = volumeEntries
            .filter((entry) => entry.isDirectory)
            .map((entry) => resolveEntry(entry, "/Volumes"))
            .filter((entry): entry is { name: string; path: string } => Boolean(entry))
            .filter((entry) => !isHiddenName(entry.name))
            .map<LocationItem>((entry) => ({
              path: entry.path,
              name: entry.name,
              kind: "volume",
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        } catch {
          locationRoots = [];
        }

        if (locationRoots.length === 0) {
          locationRoots = [{ path: "/Volumes", name: "Volumes", kind: "volume" }];
        }

        const roots: LocationItem[] = [
          { path: homePath, name: homeLabel, kind: "home" },
          ...locationRoots,
        ];
        setState({ locations: roots, error: null, homePath });
      } catch (error) {
        if (!isActive) {
          return;
        }
        setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
      }
    };

    loadRoots();

    return () => {
      isActive = false;
    };
  }, []);

  return state;
};
