export type ThemePreference = "light" | "dark" | "system";

export type UserPreferences = {
  textScale: number;
  theme: ThemePreference;
};

export const USER_PREFERENCES_STORAGE_KEY = "selector:userPreferences";
const LEGACY_TEXT_SCALE_STORAGE_KEY = "selector:text-scale";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  textScale: 1,
  theme: "system",
};

const isValidTheme = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export const normalizeTextScale = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_USER_PREFERENCES.textScale;
  }
  return value;
};

const normalizeTheme = (value: unknown): ThemePreference =>
  isValidTheme(value) ? value : DEFAULT_USER_PREFERENCES.theme;

const normalizeUserPreferences = (value: unknown): UserPreferences => {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    textScale: normalizeTextScale(raw.textScale),
    theme: normalizeTheme(raw.theme),
  };
};

const readLegacyTextScale = (): number | null => {
  try {
    const raw = window.localStorage.getItem(LEGACY_TEXT_SCALE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return normalizeTextScale(parsed);
  } catch {
    return null;
  }
};

/** Reads user preferences from localStorage, falling back to defaults on error. */
export const readUserPreferences = (): UserPreferences => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      const legacyTextScale = readLegacyTextScale();
      if (legacyTextScale !== null) {
        return { ...DEFAULT_USER_PREFERENCES, textScale: legacyTextScale };
      }
      return { ...DEFAULT_USER_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as unknown;
    return normalizeUserPreferences(parsed);
  } catch {
    const legacyTextScale = readLegacyTextScale();
    if (legacyTextScale !== null) {
      return { ...DEFAULT_USER_PREFERENCES, textScale: legacyTextScale };
    }
    return { ...DEFAULT_USER_PREFERENCES };
  }
};

/** Merges, normalizes, and persists user preferences. Returns the stored value. */
export const writeUserPreferences = (
  next: Partial<UserPreferences>,
): UserPreferences => {
  const merged = normalizeUserPreferences({ ...readUserPreferences(), ...next });

  try {
    window.localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage failures (private mode, disabled storage, etc).
  }

  return merged;
};
