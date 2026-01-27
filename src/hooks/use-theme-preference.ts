import { useEffect } from "react";
import { applyThemePreference, listenToSystemThemeChanges } from "@/lib/preferences/theme";
import { readUserPreferences } from "@/lib/preferences/storage";

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
