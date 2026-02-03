import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stat } from '@tauri-apps/plugin-fs';
import { detectFavoriteStatus } from '../favorites-service';

describe('detectFavoriteStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns available when stat succeeds', async () => {
    vi.mocked(stat).mockResolvedValue({} as never);

    const status = await detectFavoriteStatus('/Users/test');

    expect(status).toBe('available');
    expect(stat).toHaveBeenCalledWith('/Users/test');
  });

  it('returns missing when stat fails for non-volume paths', async () => {
    vi.mocked(stat).mockRejectedValue(new Error('Missing'));

    const status = await detectFavoriteStatus('/Users/test');

    expect(status).toBe('missing');
    expect(stat).toHaveBeenCalledTimes(1);
  });

  it('returns missing when volume root exists but path is missing', async () => {
    vi.mocked(stat)
      .mockRejectedValueOnce(new Error('Missing'))
      .mockResolvedValueOnce({} as never);

    const status = await detectFavoriteStatus('/Volumes/Drive/Photos');

    expect(status).toBe('missing');
    expect(stat).toHaveBeenNthCalledWith(1, '/Volumes/Drive/Photos');
    expect(stat).toHaveBeenNthCalledWith(2, '/Volumes/Drive');
  });

  it('returns offline when volume root is missing', async () => {
    vi.mocked(stat).mockRejectedValue(new Error('Missing'));

    const status = await detectFavoriteStatus('/Volumes/Drive/Photos');

    expect(status).toBe('offline');
    expect(stat).toHaveBeenNthCalledWith(1, '/Volumes/Drive/Photos');
    expect(stat).toHaveBeenNthCalledWith(2, '/Volumes/Drive');
  });
});
