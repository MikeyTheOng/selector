import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  listenToSystemThemeChanges,
  resolveThemePreference,
} from "../theme-preference";
import type { ThemePreference } from "../user-preferences";

const createMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

describe("theme preference", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("resolves explicit dark preference", () => {
    const preference: ThemePreference = "dark";
    expect(resolveThemePreference(preference)).toBe("dark");
  });

  it("resolves explicit light preference", () => {
    const preference: ThemePreference = "light";
    expect(resolveThemePreference(preference)).toBe("light");
  });

  it("resolves system preference using matchMedia", () => {
    window.matchMedia = createMatchMedia(true) as unknown as typeof window.matchMedia;
    const preference: ThemePreference = "system";
    expect(resolveThemePreference(preference)).toBe("dark");

    window.matchMedia = createMatchMedia(false) as unknown as typeof window.matchMedia;
    expect(resolveThemePreference(preference)).toBe("light");
  });

  it("applies resolved theme to document element", () => {
    window.matchMedia = createMatchMedia(true) as unknown as typeof window.matchMedia;
    expect(applyThemePreference("system")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyThemePreference("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("listens for system theme changes and updates document class", () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const mediaList = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn((_: string, callback: (event: MediaQueryListEvent) => void) => {
        listeners.push(callback);
      }),
      removeEventListener: vi.fn((_: string, callback: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(callback);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaList) as unknown as typeof window.matchMedia;

    const cleanup = listenToSystemThemeChanges();

    mediaList.matches = true;
    listeners[0]({ matches: true } as MediaQueryListEvent);
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    mediaList.matches = false;
    listeners[0]({ matches: false } as MediaQueryListEvent);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    cleanup();
    expect(mediaList.removeEventListener).toHaveBeenCalled();
  });
});
