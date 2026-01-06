import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeTextScale,
  readStoredTextScale,
  applyTextScale,
  TEXT_SCALE_STORAGE_KEY
} from '../use-text-scale';

describe('use-text-scale helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--app-text-scale');
  });

  describe('normalizeTextScale', () => {
    it('returns value if valid', () => {
      expect(normalizeTextScale(0.5)).toBe(0.5);
    });

    it('returns default if invalid', () => {
      expect(normalizeTextScale(0)).toBe(0.2);
      expect(normalizeTextScale(-1)).toBe(0.2);
      expect(normalizeTextScale(NaN)).toBe(0.2);
    });
  });

  describe('readStoredTextScale', () => {
    it('returns stored value if exists', () => {
      localStorage.setItem(TEXT_SCALE_STORAGE_KEY, '0.4');
      expect(readStoredTextScale()).toBe(0.4);
    });

    it('returns default if not stored', () => {
      expect(readStoredTextScale()).toBe(0.2);
    });

    it('returns default on invalid storage value', () => {
      localStorage.setItem(TEXT_SCALE_STORAGE_KEY, 'invalid');
      expect(readStoredTextScale()).toBe(0.2);
    });
  });

  describe('applyTextScale', () => {
    it('sets CSS variable on document element', () => {
      applyTextScale(0.3);
      expect(document.documentElement.style.getPropertyValue('--app-text-scale')).toBe('0.3');
    });
  });
});
