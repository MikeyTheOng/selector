import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsView } from '../CollectionsView';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { CollectionItemWithStatus } from '../../types';
import type { ExplorerItem } from '@/types/explorer';

// Mock hooks
vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');
vi.mock('@/features/file-explorer/components/SelectionSheet', () => ({
  SelectionSheet: () => <div data-testid="selection-sheet" />
}));
vi.mock('@/components/explorer/ExplorerListView', () => ({
  ExplorerListView: ({ items }: { items: ExplorerItem[] }) => (
    <div data-testid="explorer-list-view">
      {items.map((f) => (
        <div key={f.id}>{f.name} - {f.kindLabel} - {f.status}</div>
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
      added_at: '2024-01-01',
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
    expect(screen.getByTestId('explorer-list-view')).toBeDefined();
  });

  it('displays status for items', () => {
    const missingItems: CollectionItemWithStatus[] = [
      {
        id: 2,
        collection_id: 1,
        path: '/test/missing.txt',
        item_type: 'file',
        volume_id: null,
        added_at: '2024-01-01',
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