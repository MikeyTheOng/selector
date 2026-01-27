export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export type ResolvedTheme = "light" | "dark";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const resolveThemePreference = (preference: ThemePreference): ResolvedTheme => {
  if (preference === "dark") {
    return "dark";
  }
  if (preference === "light") {
    return "light";
  }

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
};

export const applyThemePreference = (preference: ThemePreference): ResolvedTheme => {
  const resolved = resolveThemePreference(preference);
  if (typeof document === "undefined") {
    return resolved;
  }

  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  return resolved;
};

export const listenToSystemThemeChanges = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  const handler = (event: MediaQueryListEvent) => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    if (event.matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  mediaQuery.addEventListener("change", handler);

  return () => {
    mediaQuery.removeEventListener("change", handler);
  };
};
