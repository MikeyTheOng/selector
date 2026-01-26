import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCES_STORAGE_KEY,
  readUserPreferences,
  writeUserPreferences,
} from "../user-preferences";

describe("user preferences storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("textScale", () => {
    it("returns defaults when storage is empty", () => {
      expect(readUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it("returns defaults when storage contains invalid JSON", () => {
      localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, "{");
      expect(readUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it("returns stored preferences when values are valid", () => {
      const stored = { textScale: 1.1, theme: "dark" };
      localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(stored));
      expect(readUserPreferences()).toEqual(stored);
    });

    it("normalizes invalid stored values to defaults", () => {
      const stored = { textScale: -2, theme: "nope" };
      localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(stored));
      expect(readUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it("writes merged, normalized preferences", () => {
      const updated = writeUserPreferences({ textScale: 1.2 });
      expect(updated).toEqual({ textScale: 1.2, theme: "system" });

      const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({ textScale: 1.2, theme: "system" });
    });

    it("normalizes invalid text scale before writing", () => {
      const updated = writeUserPreferences({ textScale: 0, theme: "light" });
      expect(updated).toEqual({ textScale: 1, theme: "light" });
    });
  });

  describe("theme", () => {
    it("persists valid theme values", () => {
      const updated = writeUserPreferences({ theme: "dark" });
      expect(updated).toEqual({ textScale: 1, theme: "dark" });
    });

    it("normalizes invalid theme values to system", () => {
      const stored = { textScale: 1, theme: "sepia" };
      localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(stored));
      expect(readUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });
});
