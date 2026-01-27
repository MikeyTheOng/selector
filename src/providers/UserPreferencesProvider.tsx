import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLayoutEffect } from "react";
import { applyTextScale, normalizeTextScale } from "@/lib/preferences/text";
import {
  applyThemePreference,
  listenToSystemThemeChanges,
  type ThemePreference,
} from "@/lib/preferences/theme";
import {
  readUserPreferences,
  writeUserPreferences,
  type UserPreferences,
} from "@/lib/preferences/storage";

export type UserPreferencesContextValue = {
  textScale: number;
  theme: ThemePreference;
  setTextScale: (value: number) => void;
  setTheme: (value: ThemePreference) => void;
  updatePreferences: (next: Partial<UserPreferences>) => void;
};

export const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(
  undefined,
);

const clampScale = (value: number) =>
  Math.min(1.4, Math.max(0.8, Math.round(value * 100) / 100));

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => readUserPreferences());

  const updatePreferences = useCallback((next: Partial<UserPreferences>) => {
    setPreferences((prev) => writeUserPreferences({ ...prev, ...next }));
  }, []);

  const setTextScale = useCallback(
    (value: number) => {
      updatePreferences({ textScale: normalizeTextScale(value) });
    },
    [updatePreferences],
  );

  const setTheme = useCallback(
    (value: ThemePreference) => {
      updatePreferences({ theme: value });
    },
    [updatePreferences],
  );

  useLayoutEffect(() => {
    applyTextScale(preferences.textScale);
  }, [preferences.textScale]);

  useLayoutEffect(() => {
    applyThemePreference(preferences.theme);

    if (preferences.theme === "system") {
      return listenToSystemThemeChanges();
    }

    return undefined;
  }, [preferences.theme]);

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable='true']")) {
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) {
        return;
      }

      const increaseKeys = new Set(["+", "="]);
      const decreaseKeys = new Set(["-", "_"]);

      if (increaseKeys.has(event.key)) {
        event.preventDefault();
        setTextScale(clampScale(preferences.textScale + 0.1));
      }

      if (decreaseKeys.has(event.key)) {
        event.preventDefault();
        setTextScale(clampScale(preferences.textScale - 0.1));
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [preferences.textScale, setTextScale]);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      textScale: preferences.textScale,
      theme: preferences.theme,
      setTextScale,
      setTheme,
      updatePreferences,
    }),
    [preferences.textScale, preferences.theme, setTextScale, setTheme, updatePreferences],
  );

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
};
