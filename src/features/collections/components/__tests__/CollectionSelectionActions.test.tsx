import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionSelectionActions } from '../CollectionSelectionActions';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { ExplorerItem } from '@/types/explorer';

vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');
vi.mock('../../lib/collections-repository');

describe('CollectionSelectionActions', () => {
  const mockEntries: ExplorerItem[] = [
    { id: '1', path: '/test/file1.txt', kind: 'file', name: 'file1.txt', status: 'available' }
  ];

  const defaultProps = {
    collectionId: 1,
    entries: mockEntries,
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      collections: [{ id: 2, name: 'Other Collection', created_at: '', updated_at: '' }],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
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

    expect(mockRemove).toHaveBeenCalledWith('/test/file1.txt');
    // Wait for async complete
    await vi.waitFor(() => expect(defaultProps.onComplete).toHaveBeenCalled());
  });

  it('opens picker when Copy to clicked', () => {
    render(<CollectionSelectionActions {...defaultProps} />);
    fireEvent.click(screen.getByText(/Copy to/i));
    expect(screen.getByText('Copy to Collection')).toBeDefined();
  });
});
