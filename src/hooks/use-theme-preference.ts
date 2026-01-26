import { useEffect } from "react";
import { applyThemePreference, listenToSystemThemeChanges } from "@/lib/theme-preference";
import { readUserPreferences } from "@/lib/user-preferences";

export const useThemePreference = () => {
  useEffect(() => {
    const { theme } = readUserPreferences();
    applyThemePreference(theme);

    if (theme === "system") {
      return listenToSystemThemeChanges();
    }

    return undefined;
  }, []);
};
