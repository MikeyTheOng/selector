import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsView } from '../CollectionsView';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import { useNavigation } from '@/hooks/use-navigation';
import type { CollectionItemWithStatus } from '../../types';
import type { ExplorerItem } from '@/types/explorer';

// Mock hooks
vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');
vi.mock('@/hooks/use-navigation');
vi.mock('@/features/file-explorer/components/SelectionSheet', () => ({
  SelectionSheet: () => <div data-testid="selection-sheet" />
}));

// Store onItemDoubleClick handler so tests can invoke it
let capturedDoubleClickHandler: ((item: ExplorerItem) => void) | undefined;

vi.mock('@/components/explorer/ExplorerListView', () => ({
  ExplorerListView: ({ items, onItemDoubleClick }: { items: ExplorerItem[]; onItemDoubleClick?: (item: ExplorerItem) => void }) => {
    capturedDoubleClickHandler = onItemDoubleClick;
    return (
      <div data-testid="explorer-list-view">
        {items.map((f) => (
          <div key={f.id} data-testid={`item-${f.id}`}>{f.name} - {f.kindLabel} - {f.status}</div>
        ))}
      </div>
    );
  }
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

  const mockNavigateToExplorer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedDoubleClickHandler = undefined;
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: 'collection', collectionId: '1' },
      navigateToExplorer: mockNavigateToExplorer,
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });
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

  it('renders item list', () => {
    render(<CollectionsView collectionId="1" />);
    expect(screen.getByText(/file1.txt/i)).toBeDefined();
  });

  it('does not render toolbar', () => {
    render(<CollectionsView collectionId="1" />);
    // ExplorerToolbar title
    expect(screen.queryByText('Collection Toolbar (Placeholder)')).toBeNull();
    // Previous internal toolbar title
    expect(screen.queryByText('My Collection', { selector: '.toolbar-title-class' })).toBeNull();
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

    render(<CollectionsView collectionId="1" />);
    expect(screen.getByText('Loading items...')).toBeDefined();
  });

  it('renders file list when items loaded', () => {
    render(<CollectionsView collectionId="1" />);
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

    render(<CollectionsView collectionId="1" />);
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

    render(<CollectionsView collectionId="999" />);
    expect(screen.getByText('Collection not found')).toBeDefined();
  });

  describe('double-click navigation', () => {
    it('navigates to parent folder when double-clicking an available file', () => {
      const fileItems: CollectionItemWithStatus[] = [
        {
          id: 1,
          collection_id: 1,
          path: '/Users/test/documents/photo.jpg',
          item_type: 'file',
          volume_id: null,
          added_at: '2024-01-01',
          status: 'available'
        }
      ];

      vi.mocked(useCollectionItems).mockReturnValue({
        items: fileItems,
        isLoading: false,
        error: null,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        refetch: vi.fn(),
        relinkItem: vi.fn(),
        relinkFolder: vi.fn(),
      });

      render(<CollectionsView collectionId="1" />);

      // Simulate double-click on the file
      const explorerItem = {
        id: '/Users/test/documents/photo.jpg',
        path: '/Users/test/documents/photo.jpg',
        name: 'photo.jpg',
        kind: 'file' as const,
        status: 'available' as const,
        dateModified: new Date(),
        dateModifiedLabel: 'Today at 1:00pm',
        kindLabel: 'File',
        extension: 'jpg',
      };

      capturedDoubleClickHandler?.(explorerItem);

      expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Users/test/documents', {
        focusItemPath: '/Users/test/documents/photo.jpg'
      });
    });

    it('navigates to folder when double-clicking an available folder', () => {
      const folderItems: CollectionItemWithStatus[] = [
        {
          id: 2,
          collection_id: 1,
          path: '/Users/test/documents',
          item_type: 'folder',
          volume_id: null,
          added_at: '2024-01-01',
          status: 'available'
        }
      ];

      vi.mocked(useCollectionItems).mockReturnValue({
        items: folderItems,
        isLoading: false,
        error: null,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        refetch: vi.fn(),
        relinkItem: vi.fn(),
        relinkFolder: vi.fn(),
      });

      render(<CollectionsView collectionId="1" />);

      const explorerItem = {
        id: '/Users/test/documents',
        path: '/Users/test/documents',
        name: 'documents',
        kind: 'folder' as const,
        status: 'available' as const,
        dateModified: new Date(),
        dateModifiedLabel: 'Today at 1:00pm',
        kindLabel: 'Folder',
      };

      capturedDoubleClickHandler?.(explorerItem);

      expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Users/test/documents');
    });

    it('does not navigate for missing/offline items (keeps relink behavior)', () => {
      const missingItems: CollectionItemWithStatus[] = [
        {
          id: 3,
          collection_id: 1,
          path: '/Volumes/External/file.txt',
          item_type: 'file',
          volume_id: 'External',
          added_at: '2024-01-01',
          status: 'offline'
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

      render(<CollectionsView collectionId="1" />);

      const explorerItem = {
        id: '/Volumes/External/file.txt',
        path: '/Volumes/External/file.txt',
        name: 'file.txt',
        kind: 'file' as const,
        status: 'offline' as const,
        dateModified: new Date(),
        dateModifiedLabel: 'Today at 1:00pm',
        kindLabel: 'File',
        extension: 'txt',
      };

      capturedDoubleClickHandler?.(explorerItem);

      // Should NOT navigate - instead it should trigger the relink dialog (not tested here)
      expect(mockNavigateToExplorer).not.toHaveBeenCalled();
    });
  });
});