import { renderHook, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExplorerShortcuts } from '../use-explorer-shortcuts';
import { listen, type EventCallback } from '@tauri-apps/api/event';
import type { ExplorerItem } from '@/types/explorer';

vi.mock('@tauri-apps/api/event');

type QuickLookNavigatePayload = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
};

const mockFiles: ExplorerItem[] = [
  {
    path: '/test/file1.txt',
    name: 'file1.txt',
    kind: 'file',
    extension: 'txt',
    kindLabel: 'Text',
    size: 1024,
    sizeLabel: '1024 B',
    dateModified: new Date(),
    dateModifiedLabel: '',
    status: 'available',
  },
  {
    path: '/test/file2.txt',
    name: 'file2.txt',
    kind: 'file',
    extension: 'txt',
    kindLabel: 'Text',
    size: 2048,
    sizeLabel: '2048 B',
    dateModified: new Date(),
    dateModifiedLabel: '',
    status: 'available',
  },
];

const mockFolder: ExplorerItem = {
  path: '/test/folder',
  name: 'folder',
  kind: 'folder',
  kindLabel: 'Folder',
  dateModified: new Date(),
  dateModifiedLabel: '',
  status: 'available',
};

type UseExplorerShortcutsOptions = Parameters<typeof useExplorerShortcuts>[0];

const createOptions = (
  overrides: Partial<UseExplorerShortcutsOptions> = {},
): UseExplorerShortcutsOptions => ({
  getCurrentViewItems: vi.fn(() => mockFiles),
  selectMultiple: vi.fn(),
  clearSelections: vi.fn(),
  clearFocus: vi.fn(),
  focusedPath: mockFiles[0].path,
  viewMode: 'list',
  folderId: '/test',
  onSelectFolder: vi.fn(),
  focusItem: vi.fn(),
  toggleSelection: vi.fn(),
  selectRange: vi.fn(),
  lastClickedPath: null,
  isPreviewActive: true,
  togglePreview: vi.fn(),
  closePreview: vi.fn(),
  ...overrides,
});

describe('useExplorerShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listen).mockResolvedValue(() => {});
  });

  it('handles quicklook://navigate event for selection toggle (Cmd+Enter)', async () => {
    let eventCallback: EventCallback<unknown> = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Enter',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(options.toggleSelection).toHaveBeenCalledWith(
      expect.objectContaining({ path: mockFiles[0].path }),
    );
  });

  it('handles quicklook://navigate event for navigation (ArrowDown)', async () => {
    let eventCallback: EventCallback<unknown> = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'ArrowDown',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(options.focusItem).toHaveBeenCalledWith(
      expect.objectContaining({ path: mockFiles[1].path }),
    );
  });

  it('opens the focused folder on Enter in column view', async () => {
    let eventCallback: EventCallback<unknown> = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    const options = createOptions({
      getCurrentViewItems: vi.fn(() => [mockFolder, ...mockFiles]),
      focusedPath: mockFolder.path,
      viewMode: 'column',
    });
    renderHook(() => useExplorerShortcuts(options));

    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Enter',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(options.onSelectFolder).toHaveBeenCalledWith(mockFolder.path);
  });

  it('ignores ArrowRight outside column view', () => {
    const options = createOptions({
      getCurrentViewItems: vi.fn(() => [mockFolder, ...mockFiles]),
      focusedPath: mockFolder.path,
      viewMode: 'list',
    });
    renderHook(() => useExplorerShortcuts(options));

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(options.onSelectFolder).not.toHaveBeenCalled();
  });

  it('handles quicklook://navigate event for closing preview (Escape)', async () => {
    let eventCallback: EventCallback<unknown> = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Escape',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(options.closePreview).toHaveBeenCalled();
  });

  it('handles quicklook://navigate event for toggling preview (Space)', async () => {
    let eventCallback: EventCallback<unknown> = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Space',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(options.togglePreview).toHaveBeenCalledWith(mockFiles[0].path);
  });

  it('ignores Cmd+A when focus is in an input', () => {
    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'a', metaKey: true });

    expect(options.selectMultiple).not.toHaveBeenCalled();

    input.remove();
  });

  it('ignores Cmd+A when focus is inside a dialog', () => {
    const options = createOptions();
    renderHook(() => useExplorerShortcuts(options));

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const button = document.createElement('button');
    dialog.appendChild(button);
    document.body.appendChild(dialog);

    fireEvent.keyDown(button, { key: 'a', metaKey: true });

    expect(options.selectMultiple).not.toHaveBeenCalled();

    dialog.remove();
  });
});
