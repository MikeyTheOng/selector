import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionToolbar } from '../CollectionToolbar';
import { useExplorerSelection } from '@/hooks/explorer/use-explorer-selection';
import { useCollections } from '../../hooks/use-collections';
import type { ExplorerItem } from '@/types/explorer';

vi.mock('@/hooks/explorer/use-explorer-selection');
vi.mock('../../hooks/use-collections');

describe('CollectionToolbar', () => {
  const mockSelection = {
    selectedItems: {},
    selectedEntries: [],
    focusedItem: null,
    lastClickedItem: null,
    selectCollectionItem: vi.fn(),
    selectMultipleCollectionItems: vi.fn(),
    toggleCollectionItemSelection: vi.fn(),
    focusItem: vi.fn(),
    removeSelection: vi.fn(),
    clearSelections: vi.fn(),
    selectItem: vi.fn(),
    selectMultiple: vi.fn(),
    toggleSelection: vi.fn(),
    selectedCount: 0,
    selectRange: vi.fn(),
    updateLastClickedItem: vi.fn(),
    clearLastClickedItem: vi.fn(),
    clearFocus: vi.fn(),
    getCachedItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCollections as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      collections: [
        { id: 1, name: 'Collection 1' },
        { id: 2, name: 'Collection 2' }
      ],
      isLoading: false,
      error: null
    });
  });

  const defaultProps = {
    collectionId: '1',
    isSelectionOpen: false,
    onToggleSelection: vi.fn(),
    selection: mockSelection as unknown as ReturnType<typeof useExplorerSelection>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders selection button', () => {
    render(<CollectionToolbar {...defaultProps} />);
    const button = screen.getByRole('button', { name: /selection/i });
    expect(button).toBeDefined();
  });

  it('displays selection count badge', () => {
    const selectionWithItems = {
      ...mockSelection,
      selectedItems: { '/1': true, '/2': true },
      selectedEntries: [
        { 
          path: '/1', 
          name: 'Item 1', 
          kind: 'file', 
          status: 'available',
          dateModified: new Date(),
          dateModifiedLabel: 'Today',
          kindLabel: 'File',
          extension: 'txt',
          sizeLabel: '0 KB',
        } as ExplorerItem,
        { 
          path: '/2', 
          name: 'Item 2', 
          kind: 'file', 
          status: 'available',
          dateModified: new Date(),
          dateModifiedLabel: 'Today',
          kindLabel: 'File',
          extension: 'txt',
          sizeLabel: '0 KB',
        } as ExplorerItem
      ],
    };

    render(<CollectionToolbar {...defaultProps} selection={selectionWithItems as unknown as ReturnType<typeof useExplorerSelection>} />);
    expect(screen.getByText('2')).toBeDefined();
  });

  it('disables button when no items selected', () => {
    render(<CollectionToolbar {...defaultProps} />);
    const button = screen.getByRole('button', { name: /selection/i });
    expect(button).toBeDisabled();
  });

  it('calls onToggleSelection when clicked', () => {
    const selectionWithItems = {
      ...mockSelection,
      selectedItems: { '/1': true },
      selectedEntries: [{ 
        path: '/1', 
        kind: 'file', 
        name: 'Item 1', 
        status: 'available',
        dateModified: new Date(),
        dateModifiedLabel: 'Today',
        kindLabel: 'File',
        extension: 'txt',
        sizeLabel: '0 KB',
      } as ExplorerItem],
    };

    render(<CollectionToolbar {...defaultProps} selection={selectionWithItems as unknown as ReturnType<typeof useExplorerSelection>} />);
    const button = screen.getByRole('button', { name: /selection/i });
    fireEvent.click(button);
    expect(defaultProps.onToggleSelection).toHaveBeenCalled();
  });
});
