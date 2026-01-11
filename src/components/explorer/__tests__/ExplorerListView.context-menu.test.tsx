import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExplorerListView } from '../ExplorerListView';
import type { ExplorerItem } from '@/types/explorer';

describe('ExplorerListView Context Menu', () => {
  const mockItems: ExplorerItem[] = [
    {
      id: 'file1',
      path: '/test/file1.txt',
      name: 'file1.txt',
      kind: 'file',
      status: 'available',
      dateModified: new Date(),
    }
  ];

  const defaultProps = {
    items: mockItems,
    viewMode: 'list' as const,
    selectedIds: {},
    lastClickedId: null,
    focusedId: null,
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
      expect.objectContaining({ id: 'file1' }),
      expect.anything()
    );
  });
});
