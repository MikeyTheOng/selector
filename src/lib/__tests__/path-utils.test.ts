import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  getPathBaseName,
  getParentPath,
  resolveEntry,
  isHiddenName,
  getPathHierarchy,
} from '../path-utils';
import type { LocationItem } from '@/types/explorer';

describe('path-utils', () => {
  describe('getErrorMessage', () => {
    it('returns error message from Error object', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
    });

    it('returns string error directly', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('returns default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('Something went wrong while reading this folder.');
      expect(getErrorMessage({})).toBe('Something went wrong while reading this folder.');
    });
  });

  describe('getPathBaseName', () => {
    it('returns the last segment of a path', () => {
      expect(getPathBaseName('/home/user/documents')).toBe('documents');
      expect(getPathBaseName('/home/user/documents/')).toBe('documents');
    });

    it('returns the path itself if no segments', () => {
      expect(getPathBaseName('')).toBe('');
      expect(getPathBaseName('/')).toBe('/');
    });
  });

  describe('getParentPath', () => {
    it('returns the parent directory of a file path', () => {
      expect(getParentPath('/home/user/documents/file.txt')).toBe('/home/user/documents');
      expect(getParentPath('/Users/test/photo.jpg')).toBe('/Users/test');
    });

    it('returns the parent directory of a folder path', () => {
      expect(getParentPath('/home/user/documents')).toBe('/home/user');
      expect(getParentPath('/home/user/documents/')).toBe('/home/user');
    });

    it('returns "/" for root-level items', () => {
      expect(getParentPath('/file.txt')).toBe('/');
      expect(getParentPath('/folder')).toBe('/');
    });

    it('returns "/" for root itself', () => {
      expect(getParentPath('/')).toBe('/');
    });
  });

  describe('resolveEntry', () => {
    it('returns name and path for valid entry', () => {
      const entry = { name: 'file.txt', path: '/path/file.txt' };
      expect(resolveEntry(entry, '/path')).toEqual({ name: 'file.txt', path: '/path/file.txt' });
    });

    it('returns null if name or path cannot be resolved', () => {
      expect(resolveEntry({}, '')).toBeNull();
    });
  });

  describe('isHiddenName', () => {
    it('returns true for names starting with dot', () => {
      expect(isHiddenName('.hidden')).toBe(true);
      expect(isHiddenName('.')).toBe(true);
    });

    it('returns false for normal names', () => {
      expect(isHiddenName('normal')).toBe(false);
      expect(isHiddenName('dot.in.middle')).toBe(false);
    });
  });

  describe('getPathHierarchy', () => {
    const locations: LocationItem[] = [
      { path: '/Users/test', name: 'Home', kind: 'home' },
      { path: '/Volumes/Drive', name: 'Drive', kind: 'volume' },
    ];

    it('returns correct hierarchy for path within a location', () => {
      const path = '/Users/test/Documents/Work';
      const expected = [
        '/Users/test',
        '/Users/test/Documents',
        '/Users/test/Documents/Work',
      ];
      expect(getPathHierarchy(path, locations)).toEqual(expected);
    });

    it('handles trailing slashes in locations', () => {
      const locationsWithSlash: LocationItem[] = [
        { path: '/Users/test/', name: 'Home', kind: 'home' },
      ];
      const path = '/Users/test/Documents';
      expect(getPathHierarchy(path, locationsWithSlash)).toEqual([
        '/Users/test/',
        '/Users/test/Documents',
      ]);
    });

    it('returns the path itself as root if no matching location', () => {
      const path = '/External/Path/Sub';
      expect(getPathHierarchy(path, locations)).toEqual([
        '/',
        '/External',
        '/External/Path',
        '/External/Path/Sub',
      ]);
    });

    it('returns only the root if path matches a location exactly', () => {
      const path = '/Users/test';
      expect(getPathHierarchy(path, locations)).toEqual(['/Users/test']);
    });

    it('selects the most specific location as root', () => {
      const multipleLocations: LocationItem[] = [
        { path: '/Users', name: 'Users', kind: 'home' },
        { path: '/Users/test', name: 'Home', kind: 'home' },
      ];
      const path = '/Users/test/Documents';
      expect(getPathHierarchy(path, multipleLocations)).toEqual([
        '/Users/test',
        '/Users/test/Documents',
      ]);
    });
  });
});
