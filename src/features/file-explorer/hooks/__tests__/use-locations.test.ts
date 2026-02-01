import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLocations } from '../use-locations';
import { homeDir } from '@tauri-apps/api/path';
import { readDir } from '@tauri-apps/plugin-fs';

// Mock @tauri-apps/api/path
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn(),
}));

describe('useLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads home directory and volumes', async () => {
    vi.mocked(homeDir).mockResolvedValue('/Users/test');
    vi.mocked(readDir).mockResolvedValue([
      { name: 'ExternalDrive', isDirectory: true, isFile: false, isSymlink: false }
    ]);

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.homePath).toBe('/Users/test');
    });

    expect(result.current.locations).toHaveLength(2);
    expect(result.current.locations[0]).toEqual({ path: '/Users/test', name: 'test', kind: 'home' });
    expect(result.current.locations[1]).toEqual({ path: '/Volumes/ExternalDrive', name: 'ExternalDrive', kind: 'volume' });
  });

  it('handles error in homeDir', async () => {
    vi.mocked(homeDir).mockRejectedValue(new Error('Failed to get home dir'));

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to get home dir');
    });
  });

  it('falls back to /Volumes if readDir fails', async () => {
    vi.mocked(homeDir).mockResolvedValue('/Users/test');
    vi.mocked(readDir).mockRejectedValue(new Error('Cannot read /Volumes'));

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.homePath).toBe('/Users/test');
    });

    expect(result.current.locations).toHaveLength(2);
    expect(result.current.locations[1]).toEqual({ path: '/Volumes', name: 'Volumes', kind: 'volume' });
  });
});
