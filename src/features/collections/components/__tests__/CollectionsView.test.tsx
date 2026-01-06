import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsView } from '../CollectionsView';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { CollectionItemWithStatus } from '../../types';
import type { FolderListing } from '@/types/fs';

// Mock hooks
vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');
vi.mock('../CollectionListView', () => ({
  CollectionListView: ({ listing }: { listing: FolderListing }) => (
    <div data-testid="file-list-view">
      {listing.files.map((f) => (
        <div key={f.path}>{f.name} - {f.kindLabel} - {f.status}</div>
      ))}
    </div>
  )
}));

describe('CollectionsView', () => {
  const mockCollection = { id: 1, name: 'My Collection', created_at: '', updated_at: '' };
  const mockItems: CollectionItemWithStatus[] = [
    {
      id: 1,
      collection_id: 1,
      path: '/test/file1.txt',
      item_type: 'file',
      volume_id: null,
      added_at: '',
      status: 'available'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      collections: [mockCollection],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
    vi.mocked(useCollectionItems).mockReturnValue({
      items: mockItems,
      isLoading: false,
      error: null,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      refetch: vi.fn(),
      relinkItem: vi.fn(),
      relinkFolder: vi.fn(),
    });
  });

  it('renders collection name', () => {
    render(<CollectionsView collectionId={1} />);
    expect(screen.getByText('My Collection')).toBeDefined();
  });

  it('renders loading state', () => {
    vi.mocked(useCollectionItems).mockReturnValue({
      items: [],
      isLoading: true,
      error: null,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      refetch: vi.fn(),
      relinkItem: vi.fn(),
      relinkFolder: vi.fn(),
    });

    render(<CollectionsView collectionId={1} />);
    expect(screen.getByText('Loading items...')).toBeDefined();
  });

  it('renders file list when items loaded', () => {
    render(<CollectionsView collectionId={1} />);
    expect(screen.getByTestId('file-list-view')).toBeDefined();
  });

  it('displays missing status for items', () => {
    const missingItems: CollectionItemWithStatus[] = [
      {
        id: 2,
        collection_id: 1,
        path: '/test/missing.txt',
        item_type: 'file',
        volume_id: null,
        added_at: '',
        status: 'missing'
      }
    ];

    vi.mocked(useCollectionItems).mockReturnValue({
      items: missingItems,
      isLoading: false,
      error: null,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      refetch: vi.fn(),
      relinkItem: vi.fn(),
      relinkFolder: vi.fn(),
    });

    render(<CollectionsView collectionId={1} />);
    // Based on current implementation which appends status to kindLabel
    expect(screen.getByText(/missing/i)).toBeDefined(); 
  });

  it('shows error if collection not found', () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsView collectionId={999} />);
    expect(screen.getByText('Collection not found')).toBeDefined();
  });
});
