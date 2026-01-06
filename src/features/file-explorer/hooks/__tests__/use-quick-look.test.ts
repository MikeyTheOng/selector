import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuickLook } from '../use-quick-look';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('useQuickLook', () => {
  const mockInvoke = vi.mocked(invoke);
  const mockListen = vi.mocked(listen);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default listen mock: returns a promise that resolves to an unlisten function
    mockListen.mockResolvedValue(() => { });
  });

  it('initially has inactive preview state', () => {
    const { result } = renderHook(() => useQuickLook());
    expect(result.current.isPreviewActive).toBe(false);
  });

  it('sets up event listener on mount', () => {
    renderHook(() => useQuickLook());
    expect(mockListen).toHaveBeenCalledWith('quicklook://closed', expect.any(Function));
  });

  it('toggles preview on', async () => {
    mockInvoke.mockResolvedValue(true); // Return visible = true

    const { result } = renderHook(() => useQuickLook());

    await act(async () => {
      await result.current.togglePreview('/path/to/file');
    });

    expect(mockInvoke).toHaveBeenCalledWith('toggle_preview', { path: '/path/to/file' });
    expect(result.current.isPreviewActive).toBe(true);
  });

  it('toggles preview off', async () => {
    mockInvoke.mockResolvedValue(false); // Return visible = false

    const { result } = renderHook(() => useQuickLook());

    // First ensure it's on (manually or via test sequence, but direct testing is cleaner)
    // Here we just test the return value handling
    await act(async () => {
      await result.current.togglePreview('/path/to/file');
    });

    expect(mockInvoke).toHaveBeenCalledWith('toggle_preview', { path: '/path/to/file' });
    expect(result.current.isPreviewActive).toBe(false);
  });

  it('updates preview', async () => {
    const { result } = renderHook(() => useQuickLook());

    await act(async () => {
      await result.current.updatePreview('/new/path');
    });

    expect(mockInvoke).toHaveBeenCalledWith('update_preview', { path: '/new/path' });
  });

  it('closes preview', async () => {
    mockInvoke.mockResolvedValue(false);

    const { result } = renderHook(() => useQuickLook());

    // Manually set state to true first? 
    // We can't easily access setIsPreviewActive.
    // We simulate the flow: toggle ON, then close.
    mockInvoke.mockResolvedValueOnce(true);
    await act(async () => {
      await result.current.togglePreview('/path');
    });
    expect(result.current.isPreviewActive).toBe(true);

    // Now close
    await act(async () => {
      await result.current.closePreview();
    });

    expect(mockInvoke).toHaveBeenCalledWith('toggle_preview', { path: '' });
    expect(result.current.isPreviewActive).toBe(false);
  });

  it('updates state when quicklook://closed event is received', async () => {
    let eventCallback: (payload: unknown) => void = () => { };
    mockListen.mockImplementation((event, callback) => {
      if (event === 'quicklook://closed') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    const { result } = renderHook(() => useQuickLook());

    // Set active first
    mockInvoke.mockResolvedValue(true);
    await act(async () => {
      await result.current.togglePreview('/path');
    });
    expect(result.current.isPreviewActive).toBe(true);

    // Simulate event
    await act(async () => {
      eventCallback({});
    });

    expect(result.current.isPreviewActive).toBe(false);
  });
});
