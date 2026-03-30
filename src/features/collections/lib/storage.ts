export const REMEMBERED_COLLECTION_STORAGE_KEY =
  "selector:collections:rememberedCollectionId";

export function getLastUsedCollectionId(): number | null {
  try {
    const raw = window.localStorage.getItem(REMEMBERED_COLLECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

export function setLastUsedCollectionId(id: number): void {
  window.localStorage.setItem(REMEMBERED_COLLECTION_STORAGE_KEY, String(id));
}

export function clearLastUsedCollectionId(): void {
  window.localStorage.removeItem(REMEMBERED_COLLECTION_STORAGE_KEY);
}
