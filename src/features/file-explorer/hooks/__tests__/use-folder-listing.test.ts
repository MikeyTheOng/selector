import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFolderListing } from '../use-folder-listing';
import { fsModule } from '@/lib/tauri/fs';
import { watch, type WatchEvent } from '@tauri-apps/plugin-fs';
import type { FsDirEntry, LocationItem } from '@/types/fs';

// Mock the fsModule
vi.mock('@/lib/tauri/fs', () => ({
  fsModule: {
    readDir: vi.fn(),
    stat: vi.fn(),
  }
}));

// Mock @tauri-apps/plugin-fs watch
vi.mock('@tauri-apps/plugin-fs', () => ({
  watch: vi.fn(() => Promise.resolve(() => { })),
}));

// Helper to mock successful directory read
const mockReadDirSuccess = (entries: FsDirEntry[]) => {
  vi.mocked(fsModule.readDir).mockResolvedValue(entries);
};

// Helper to mock successful stat
const mockStatSuccess = (mtime: Date | null = null, size: number = 0) => {
  vi.mocked(fsModule.stat).mockResolvedValue({ mtime, size });
};

describe('useFolderListing', () => {
  const locations: LocationItem[] = [
    { path: '/home', name: 'Home', kind: 'home' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially returns an empty loading state', () => {
    mockReadDirSuccess([]);
    const { result } = renderHook(() => useFolderListing(null, locations));

    expect(result.current.listing.isLoading).toBe(false);
    expect(result.current.listing.files).toEqual([]);
    expect(result.current.listing.folders).toEqual([]);
  });

  it('loads folder content when selectedFolder is provided', async () => {
    const mockEntries = [
      { name: 'folder1', isDirectory: true, isFile: false, path: '/test/folder1' },
      { name: 'file1.txt', isDirectory: false, isFile: true, path: '/test/file1.txt' },
      { name: '.hidden', isDirectory: false, isFile: true, path: '/test/.hidden' },
    ];

    mockReadDirSuccess(mockEntries);
    mockStatSuccess(new Date('2024-01-01T12:00:00Z'), 1024);

    const { result } = renderHook(() => useFolderListing('/test', locations));

    // Wait for the async loading to complete
    await waitFor(() => {
      expect(result.current.listing.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(fsModule.readDir).toHaveBeenCalled();
    expect(result.current.listing.folderCount).toBe(1);
    expect(result.current.listing.fileCount).toBe(1);
  });

  it('sets up watchers for the path hierarchy', async () => {
    mockReadDirSuccess([]);
    renderHook(() => useFolderListing('/home/user', locations));

    await waitFor(() => {
      expect(watch).toHaveBeenCalledWith('/home', expect.any(Function), expect.any(Object));
      expect(watch).toHaveBeenCalledWith('/home/user', expect.any(Function), expect.any(Object));
    });
  });

  it('provides cached listings and allows ensuring them', async () => {
    mockReadDirSuccess([]);
    const { result } = renderHook(() => useFolderListing('/home', locations));

    await waitFor(() => {
      expect(result.current.listing.isLoading).toBe(false);
    });

    // Test getListingForPath for current folder
    expect(result.current.getListingForPath('/home')).toBeDefined();

    // Test ensureListing for a new folder
    act(() => {
      result.current.ensureListing('/home/sub');
    });

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalledWith('/home/sub', expect.any(Object));
    });
  });

  it('refreshes listing when window is focused', async () => {
    mockReadDirSuccess([]);
    renderHook(() => useFolderListing('/home', locations));

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalledTimes(1);
    });

    // Simulate window focus
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalledTimes(2);
    });
  });

  it('refreshes listing when watch event occurs', async () => {
    let watchCallback: (event: WatchEvent) => void = () => { };
    vi.mocked(watch).mockImplementation((_path, callback) => {
      watchCallback = callback;
      return Promise.resolve(() => { });
    });

    mockReadDirSuccess([]);
    renderHook(() => useFolderListing('/home', locations));

    await waitFor(() => {
      expect(watch).toHaveBeenCalled();
    });

    // Reset call count for readDir
    vi.mocked(fsModule.readDir).mockClear();
    mockReadDirSuccess([]);

    // Simulate watch event
    await act(async () => {
      watchCallback({ type: 'create', paths: ['/home/newfile.txt'] });
    });

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalled();
    });
  });

  it('refreshes listing when document becomes visible', async () => {
    mockReadDirSuccess([]);
    renderHook(() => useFolderListing('/home', locations));

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalledTimes(1);
    });

    // Mock visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true
    });

    // Simulate visibility change
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(fsModule.readDir).toHaveBeenCalledTimes(2);
    });
  });
});
