import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionSelectionActions } from '../CollectionSelectionActions';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { ExplorerItem } from '@/types/explorer';

vi.mock('../../hooks/use-collection-items');

describe('CollectionSelectionActions', () => {
  const mockEntries: ExplorerItem[] = [
    { id: '1', path: '/test/file1.txt', kind: 'file', name: 'file1.txt', status: 'available' }
  ];

  const defaultProps = {
    collectionId: 1,
    entries: mockEntries,
    onRequestCopy: vi.fn(),
    onRequestMove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollectionItems).mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      removeItemByPath: vi.fn(),
      refetch: vi.fn(),
      relinkItem: vi.fn(),
      relinkFolder: vi.fn(),
    });
  });

  it('renders actions', () => {
    render(<CollectionSelectionActions {...defaultProps} />);
    expect(screen.getByText(/Copy to/i)).toBeDefined();
    expect(screen.getByText(/Move to/i)).toBeDefined();
    expect(screen.getByText(/Remove from Collection/i)).toBeDefined();
  });

  it('calls removeItemByPath when Remove clicked', async () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCollectionItems).mockReturnValue({
      ...vi.mocked(useCollectionItems)(),
      removeItemByPath: mockRemove,
    });

    render(<CollectionSelectionActions {...defaultProps} />);
    fireEvent.click(screen.getByText(/Remove from Collection/i));

    await vi.waitFor(() => expect(mockRemove).toHaveBeenCalledWith('/test/file1.txt'));
  });

  it('requests copy when Copy to clicked', () => {
    render(<CollectionSelectionActions {...defaultProps} />);
    fireEvent.click(screen.getByText(/Copy to/i));
    expect(defaultProps.onRequestCopy).toHaveBeenCalledWith(mockEntries);
  });

  it('requests move when Move to clicked', () => {
    render(<CollectionSelectionActions {...defaultProps} />);
    fireEvent.click(screen.getByText(/Move to/i));
    expect(defaultProps.onRequestMove).toHaveBeenCalledWith(mockEntries);
  });
});
