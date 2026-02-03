import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLocations } from '../use-locations';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { readDir } from '@tauri-apps/plugin-fs';
import { detectFavoriteStatus, getUserFavorites } from '../../lib/favorites-service';
import { addFavoriteLocation, removeFavoriteLocation } from '../../data/favorite-locations-repository';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

// Mock @tauri-apps/api/path
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn(),
  pictureDir: vi.fn(),
}));

vi.mock('../../lib/favorites-service', async () => {
  const actual = await vi.importActual<typeof import('../../lib/favorites-service')>(
    '../../lib/favorites-service',
  );
  return {
    ...actual,
    detectFavoriteStatus: vi.fn(),
    getUserFavorites: vi.fn(),
  };
});

vi.mock('../../data/favorite-locations-repository', () => ({
  addFavoriteLocation: vi.fn(),
  removeFavoriteLocation: vi.fn(),
}));

describe('useLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detectFavoriteStatus).mockResolvedValue('available');
    vi.mocked(getUserFavorites).mockResolvedValue([]);
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
      expect(result.current).toHaveProperty('addFavorite');
      expect(result.current).toHaveProperty('removeFavorite');
      expect(result.current).not.toHaveProperty('locations');
      expect(result.current).not.toHaveProperty('homePath');
    });
  });

  describe('favorites', () => {
    it('includes Home and Pictures as favorites with favoriteType', async () => {
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
        favoriteType: 'home',
        status: 'available',
      });
      expect(result.current.favorites[1]).toEqual({
        path: '/Users/test/Pictures',
        name: 'Pictures',
        kind: 'favorite',
        favoriteType: 'pictures',
        status: 'available',
      });
    });

    it('propagates missing/offline status for built-ins', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);
      vi.mocked(detectFavoriteStatus).mockImplementation(async (path) => {
        return path.endsWith('/Pictures') ? 'offline' : 'missing';
      });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      expect(result.current.favorites[0]).toMatchObject({
        path: '/Users/test',
        favoriteType: 'home',
        status: 'missing',
      });
      expect(result.current.favorites[1]).toMatchObject({
        path: '/Users/test/Pictures',
        favoriteType: 'pictures',
        status: 'offline',
      });
    });

    it('skips favorite with failed path lookup and logs error', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockRejectedValue(new Error('Not available'));
      vi.mocked(readDir).mockResolvedValue([]);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
      });

      expect(result.current.favorites[0]).toEqual({
        path: '/Users/test',
        name: 'test',
        kind: 'favorite',
        favoriteType: 'home',
        status: 'available',
      });
      expect(result.current.error).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to resolve Pictures path:',
        expect.any(Error),
      );

      errorSpy.mockRestore();
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

  describe('custom favorites', () => {
    it('merges custom favorites after built-ins', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);
      vi.mocked(getUserFavorites).mockResolvedValue([
        {
          path: '/Custom',
          name: 'Custom',
          kind: 'favorite',
          favoriteType: 'custom',
          status: 'available',
        },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(3);
      });

      expect(result.current.favorites[2].path).toBe('/Custom');
    });
  });

  describe('add/remove', () => {
    it('adds a favorite and refreshes', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      await act(async () => {
        await result.current.addFavorite('/Custom');
      });
      expect(addFavoriteLocation).toHaveBeenCalledWith('/Custom');
    });

    it('ignores built-ins (Home/Pictures) including normalized paths', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      await act(async () => {
        await result.current.addFavorite('/Users/test/');
        await result.current.addFavorite('/Users/test/Pictures/');
      });

      expect(addFavoriteLocation).not.toHaveBeenCalled();
      expect(result.current.favorites).toHaveLength(2);
    });

    it('adds optimistic favorite after DB write resolves but before refresh completes', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);
      vi.mocked(detectFavoriteStatus).mockResolvedValue('available');

      const refreshDeferred = createDeferred<Awaited<ReturnType<typeof getUserFavorites>>>();
      vi.mocked(getUserFavorites)
        .mockResolvedValueOnce([])
        .mockImplementationOnce(() => refreshDeferred.promise)
        .mockResolvedValue([]);

      const addDeferred = createDeferred<void>();
      vi.mocked(addFavoriteLocation).mockImplementation(() => addDeferred.promise);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      let addPromise!: Promise<void>;
      await act(async () => {
        addPromise = result.current.addFavorite('/Custom');
      });

      expect(addFavoriteLocation).toHaveBeenCalledWith('/Custom');
      expect(result.current.favorites).toHaveLength(2);

      await act(async () => {
        addDeferred.resolve();
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(3);
      });

      let addResolved = false;
      void addPromise.then(() => {
        addResolved = true;
      });
      await Promise.resolve();
      expect(addResolved).toBe(false);

      await act(async () => {
        refreshDeferred.resolve([
          {
            path: '/Custom',
            name: 'Custom',
            kind: 'favorite',
            favoriteType: 'custom',
            status: 'available',
          },
        ]);
      });

      await act(async () => {
        await addPromise;
      });

      expect(result.current.favorites).toHaveLength(3);
      expect(result.current.favorites[2].path).toBe('/Custom');
    });

    it('removes a favorite and refreshes', async () => {
      vi.mocked(homeDir).mockResolvedValue('/Users/test');
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      await act(async () => {
        await result.current.removeFavorite('/Custom');
      });
      expect(removeFavoriteLocation).toHaveBeenCalledWith('/Custom');
    });
  });

  describe('error handling', () => {
    it('skips failed favorite and still loads remaining favorites', async () => {
      vi.mocked(homeDir).mockRejectedValue(new Error('Failed to get home dir'));
      vi.mocked(pictureDir).mockResolvedValue('/Users/test/Pictures');
      vi.mocked(readDir).mockResolvedValue([]);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
      });

      expect(result.current.favorites[0]).toEqual({
        path: '/Users/test/Pictures',
        name: 'Pictures',
        kind: 'favorite',
        favoriteType: 'pictures',
        status: 'available',
      });
      expect(result.current.error).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to resolve Home path:',
        expect.any(Error),
      );

      errorSpy.mockRestore();
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
