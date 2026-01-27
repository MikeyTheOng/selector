import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeTextScale,
  readStoredTextScale,
  applyTextScale,
} from '../use-text-scale';
import { DEFAULT_USER_PREFERENCES, USER_PREFERENCES_STORAGE_KEY } from "@/lib/preferences/storage";

describe("use-text-scale helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--app-text-scale");
  });

  describe("normalizeTextScale", () => {
    it("returns value if valid", () => {
      expect(normalizeTextScale(0.5)).toBe(0.5);
    });

    it("returns default if invalid", () => {
      expect(normalizeTextScale(0)).toBe(DEFAULT_USER_PREFERENCES.textScale);
      expect(normalizeTextScale(-1)).toBe(DEFAULT_USER_PREFERENCES.textScale);
      expect(normalizeTextScale(NaN)).toBe(DEFAULT_USER_PREFERENCES.textScale);
    });
  });

  describe("readStoredTextScale", () => {
    it("returns stored value if exists", () => {
      localStorage.setItem(
        USER_PREFERENCES_STORAGE_KEY,
        JSON.stringify({ textScale: 1.2, theme: "dark" }),
      );
      expect(readStoredTextScale()).toBe(1.2);
    });

    it("returns default if not stored", () => {
      expect(readStoredTextScale()).toBe(DEFAULT_USER_PREFERENCES.textScale);
    });

    it("returns default on invalid storage value", () => {
      localStorage.setItem(
        USER_PREFERENCES_STORAGE_KEY,
        JSON.stringify({ textScale: "invalid", theme: "system" }),
      );
      expect(readStoredTextScale()).toBe(DEFAULT_USER_PREFERENCES.textScale);
    });
  });

  describe("applyTextScale", () => {
    it("sets CSS variable on document element", () => {
      applyTextScale(0.3);
      expect(document.documentElement.style.getPropertyValue("--app-text-scale")).toBe("0.3");
    });
  });
});
