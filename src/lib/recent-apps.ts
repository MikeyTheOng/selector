import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEY = "recent_apps_by_extension";
const MAX_APPS_PER_EXTENSION = 5;

export interface AppInfo {
  name: string;
  path: string;
  bundleId?: string;
  lastUsed: number;
}

interface RecentAppsStorage {
  [extension: string]: AppInfo[];
}

function getStorage(): RecentAppsStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RecentAppsStorage;
  } catch (error) {
    console.error("Failed to parse recent apps storage:", error);
    return {};
  }
}

function setStorage(data: RecentAppsStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save recent apps storage:", error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      clearOldestEntries(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error("Failed to save even after cleanup:", retryError);
      }
    }
  }
}

function clearOldestEntries(data: RecentAppsStorage): void {
  const extensions = Object.keys(data);
  
  let oldestExt: string | null = null;
  let oldestTime = Infinity;

  for (const ext of extensions) {
    const apps = data[ext];
    if (apps.length > 0) {
      const minTime = Math.min(...apps.map((app) => app.lastUsed));
      if (minTime < oldestTime) {
        oldestTime = minTime;
        oldestExt = ext;
      }
    }
  }

  if (oldestExt) {
    delete data[oldestExt];
  }
}

function normalizeExtension(extension: string): string {
  return extension.toLowerCase().replace(/^\./, "");
}

async function verifyAppExists(appPath: string): Promise<boolean> {
  try {
    const exists = await invoke<boolean>("verify_app_exists", { appPath });
    return exists;
  } catch (error) {
    console.error(`Failed to verify app path: ${appPath}`, error);
    return false;
  }
}

export async function getRecentApps(extension: string): Promise<AppInfo[]> {
  const normalizedExt = normalizeExtension(extension);
  const storage = getStorage();
  const apps = storage[normalizedExt] || [];

  // Verify each app exists
  const validApps: AppInfo[] = [];
  const invalidApps: AppInfo[] = [];

  for (const app of apps) {
    const exists = await verifyAppExists(app.bundleId || app.path);
    if (exists) {
      validApps.push(app);
    } else {
      invalidApps.push(app);
    }
  }

  if (invalidApps.length > 0) {
    storage[normalizedExt] = validApps;
    setStorage(storage);
  }

  return validApps;
}

/**
 * Add or update a recent app for a specific file extension
 * Updates lastUsed timestamp if app already exists
 * Maintains max 5 apps per extension, sorted by most recent
 */
export function addRecentApp(
  extension: string,
  app: Omit<AppInfo, "lastUsed">,
): void {
  const normalizedExt = normalizeExtension(extension);
  const storage = getStorage();

  const apps = storage[normalizedExt] || [];
  const now = Date.now();

  const existingIndex = apps.findIndex((a) => {
    if (app.bundleId && a.bundleId) {
      return a.bundleId === app.bundleId;
    }
    return a.path === app.path;
  });

  if (existingIndex !== -1) {
    apps[existingIndex] = {
      ...app,
      lastUsed: now,
    };
  } else {
    apps.push({
      ...app,
      lastUsed: now,
    });
  }

  apps.sort((a, b) => b.lastUsed - a.lastUsed);

  storage[normalizedExt] = apps.slice(0, MAX_APPS_PER_EXTENSION);

  setStorage(storage);
}

export function clearRecentApps(extension?: string): void {
  if (extension) {
    const normalizedExt = normalizeExtension(extension);
    const storage = getStorage();
    delete storage[normalizedExt];
    setStorage(storage);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getAllExtensions(): string[] {
  const storage = getStorage();
  return Object.keys(storage);
}
