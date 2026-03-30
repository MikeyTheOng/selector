import { fireEvent, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileExplorerShortcuts } from '../use-file-explorer-shortcuts';
import type { ExplorerItem } from '@/types/explorer';

const selectedEntries: ExplorerItem[] = [
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
];

describe('useFileExplorerShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers quick add for Cmd/Ctrl+P', () => {
    const onQuickAdd = vi.fn();

    renderHook(() =>
      useFileExplorerShortcuts({
        selectedEntries,
        onQuickAdd,
      }),
    );

    fireEvent.keyDown(window, { key: 'p', metaKey: true });

    expect(onQuickAdd).toHaveBeenCalledWith(selectedEntries);
  });

  it('ignores Cmd/Ctrl+P when there is no selection', () => {
    const onQuickAdd = vi.fn();

    renderHook(() =>
      useFileExplorerShortcuts({
        selectedEntries: [],
        onQuickAdd,
      }),
    );

    fireEvent.keyDown(window, { key: 'p', metaKey: true });

    expect(onQuickAdd).not.toHaveBeenCalled();
  });

  it('ignores Cmd/Ctrl+P inside editable elements', () => {
    const onQuickAdd = vi.fn();

    renderHook(() =>
      useFileExplorerShortcuts({
        selectedEntries,
        onQuickAdd,
      }),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'p', metaKey: true });

    expect(onQuickAdd).not.toHaveBeenCalled();

    input.remove();
  });

  it('ignores Cmd/Ctrl+P inside dialogs', () => {
    const onQuickAdd = vi.fn();

    renderHook(() =>
      useFileExplorerShortcuts({
        selectedEntries,
        onQuickAdd,
      }),
    );

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const button = document.createElement('button');
    dialog.appendChild(button);
    document.body.appendChild(dialog);

    fireEvent.keyDown(button, { key: 'p', metaKey: true });

    expect(onQuickAdd).not.toHaveBeenCalled();

    dialog.remove();
  });
});
