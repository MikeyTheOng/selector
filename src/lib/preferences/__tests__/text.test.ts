import { describe, it, expect, beforeEach } from "vitest";
import { applyTextScale, normalizeTextScale, DEFAULT_TEXT_SCALE } from "../text";

describe("text preference helpers", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--app-text-scale");
  });

  describe("normalizeTextScale", () => {
    it("returns value if valid", () => {
      expect(normalizeTextScale(0.5)).toBe(0.5);
    });

    it("returns default if invalid", () => {
      expect(normalizeTextScale(0)).toBe(DEFAULT_TEXT_SCALE);
      expect(normalizeTextScale(-1)).toBe(DEFAULT_TEXT_SCALE);
      expect(normalizeTextScale(NaN)).toBe(DEFAULT_TEXT_SCALE);
    });
  });

  describe("applyTextScale", () => {
    it("sets CSS variable on document element", () => {
      applyTextScale(0.3);
      expect(document.documentElement.style.getPropertyValue("--app-text-scale")).toBe("0.3");
    });
  });
});
