import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExplorerListView } from '../ExplorerListView';
import type { ExplorerItem } from '@/types/explorer';

describe('ExplorerListView Context Menu', () => {
  const mockItems: ExplorerItem[] = [
    {
      path: '/test/file1.txt',
      name: 'file1.txt',
      kind: 'file',
      status: 'available',
      dateModified: new Date(),
      dateModifiedLabel: '2023-01-01',
      kindLabel: 'Text Document',
      sizeLabel: '1 KB',
      extension: 'txt',
    } as ExplorerItem
  ];

  const defaultProps = {
    items: mockItems,
    viewMode: 'list' as const,
    selectedPaths: {},
    lastClickedPath: null,
    focusedPath: null,
    onItemClick: vi.fn(),
    onItemDoubleClick: vi.fn(),
    emptyMessage: 'No items found.',
  };

  it('calls onItemContextMenu when an item is right-clicked', () => {
    const onItemContextMenu = vi.fn();
    render(<ExplorerListView {...defaultProps} onItemContextMenu={onItemContextMenu} />);
    
    const fileRow = screen.getByText('file1.txt').closest('button');
    fireEvent.contextMenu(fileRow!);

    expect(onItemContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test/file1.txt' }),
      expect.anything()
    );
  });
});
