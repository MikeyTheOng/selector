import { describe, it, expect } from 'vitest';
import { formatSize, formatDateTime, getExtension, getKindLabel } from '../formatters';

describe('formatters', () => {
  describe('formatSize', () => {
    it('returns "-" for non-number values', () => {
      expect(formatSize(undefined)).toBe('-');
      expect(formatSize(NaN)).toBe('-');
    });

    it('formats bytes correctly', () => {
      expect(formatSize(500)).toBe('500 B');
    });

    it('formats kilobytes correctly', () => {
      expect(formatSize(1024)).toBe('1.0 KB');
      expect(formatSize(10240)).toBe('10 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatSize(10.5 * 1024 * 1024)).toBe('11 MB');
    });

    it('formats gigabytes and beyond', () => {
      expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });
  });

  describe('formatDateTime', () => {
    it('returns "-" for invalid dates', () => {
      expect(formatDateTime(undefined)).toBe('-');
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime(new Date('invalid'))).toBe('-');
    });

    it('formats valid dates correctly', () => {
      const date = new Date('2024-01-01T12:00:00');
      // The exact output depends on locale, but it should contain year and time
      const result = formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('at');
    });
  });

  describe('getExtension', () => {
    it('extracts extension correctly', () => {
      expect(getExtension('file.txt')).toBe('txt');
      expect(getExtension('archive.tar.gz')).toBe('gz');
      expect(getExtension('IMAGE.PNG')).toBe('png');
    });

    it('returns empty string if no extension', () => {
      expect(getExtension('noextension')).toBe('');
      expect(getExtension('.hidden')).toBe('');
      expect(getExtension('endsindot.')).toBe('');
    });
  });

  describe('getKindLabel', () => {
    it('returns "File" for empty extension', () => {
      expect(getKindLabel('')).toBe('File');
    });

    it('returns specific label for known extensions', () => {
      expect(getKindLabel('pdf')).toBe('PDF document');
      expect(getKindLabel('jpg')).toBe('JPEG image');
    });

    it('returns uppercase extension for unknown extensions', () => {
      expect(getKindLabel('xyz')).toBe('XYZ');
    });
  });
});
