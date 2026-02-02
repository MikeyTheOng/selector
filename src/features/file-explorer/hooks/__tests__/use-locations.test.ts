import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLocations } from '../use-locations';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { readDir } from '@tauri-apps/plugin-fs';

// Mock @tauri-apps/api/path
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn(),
  pictureDir: vi.fn(),
}));

describe('useLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('return shape', () => {
    it('returns { favorites, volumes, rootLocations, error }', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([
        { name: 'Macintosh HD', isDirectory: true, isFile: false, isSymlink: false },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites.length).toBeGreaterThan(0);
      });

      // Assert the shape has no legacy `locations` or `homePath` fields
      expect(result.current).toHaveProperty('favorites');
      expect(result.current).toHaveProperty('volumes');
      expect(result.current).toHaveProperty('rootLocations');
      expect(result.current).toHaveProperty('error');
      expect(result.current).not.toHaveProperty('locations');
      expect(result.current).not.toHaveProperty('homePath');
    });
  });

  describe('favorites', () => {
    it('includes Home and Pictures as favorites', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      expect(result.current.favorites[0]).toEqual({
        path: '/Users/test',
        name: 'test',
        kind: 'favorite',
      });
      expect(result.current.favorites[1]).toEqual({
        path: '/Users/test/Pictures',
        name: 'Pictures',
        kind: 'favorite',
      });
    });

    it('sets error if pictureDir is unavailable', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockRejectedValue(new Error('Not available'));
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBe('Not available');
      });

      expect(result.current.favorites).toHaveLength(0);
    });
  });

  describe('volumes', () => {
    it('reads volumes from /Volumes, directories only, no hidden entries', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([
        { name: 'Macintosh HD', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'ExternalDrive', isDirectory: true, isFile: false, isSymlink: false },
        { name: '.hidden', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'somefile.txt', isDirectory: false, isFile: true, isSymlink: false },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.volumes.length).toBeGreaterThan(0);
      });

      expect(result.current.volumes).toHaveLength(2);
      expect(result.current.volumes[0]).toEqual({
        path: '/Volumes/Macintosh HD',
        name: 'Macintosh HD',
        kind: 'volume',
      });
      expect(result.current.volumes[1]).toEqual({
        path: '/Volumes/ExternalDrive',
        name: 'ExternalDrive',
        kind: 'volume',
      });
    });

    it('preserves /Volumes ordering (no sorting)', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([
        { name: 'Zebra', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'Alpha', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'Middle', isDirectory: true, isFile: false, isSymlink: false },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.volumes).toHaveLength(3);
      });

      // Order must match readDir order, not alphabetical
      expect(result.current.volumes[0].name).toBe('Zebra');
      expect(result.current.volumes[1].name).toBe('Alpha');
      expect(result.current.volumes[2].name).toBe('Middle');
    });

    it('returns empty volumes when /Volumes read fails', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockRejectedValue(new Error('Cannot read /Volumes'));

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      expect(result.current.volumes).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it('returns empty volumes when /Volumes yields no directories', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      expect(result.current.volumes).toHaveLength(0);
    });
  });

  describe('rootLocations', () => {
    it('is [...favorites, ...volumes]', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([
        { name: 'Macintosh HD', isDirectory: true, isFile: false, isSymlink: false },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.rootLocations.length).toBeGreaterThan(0);
      });

      expect(result.current.rootLocations).toEqual([
        ...result.current.favorites,
        ...result.current.volumes,
      ]);
      expect(result.current.rootLocations).toHaveLength(3); // Home + Pictures + 1 volume
    });
  });

  describe('error handling', () => {
    it('sets error when homeDir fails', async () => {
      vi.mocked(homeDir).mockRejectedValue(new Error('Failed to get home dir'));

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to get home dir');
      });
    });

    it('has null error on success', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
