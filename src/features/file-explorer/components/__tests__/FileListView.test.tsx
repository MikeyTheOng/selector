import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileListView } from '../FileListView';
import type { FolderListing } from '@/types/explorer';
import type { ContextMenuItemAction } from '@/components/explorer/ExplorerContextMenu';
import type { FavoriteLocationItem } from '../../types';

// Simple mock for FileRowLabel
vi.mock('../FileRowLabel', () => ({
  FileRowLabel: ({ name }: { name: string }) => <div>{name}</div>,
}));

const showContextMenu = vi.fn();
vi.mock('@/components/explorer/ExplorerContextMenu', () => ({
  useExplorerContextMenu: () => ({ showContextMenu }),
}));

describe('FileListView', () => {
  const mockListing: FolderListing = {
    folders: [
      { path: '/test/folder1', name: 'folder1', dateModified: new Date(), dateModifiedLabel: 'Jan 1, 2024', status: 'available', kindLabel: 'Folder' }
    ],
    files: [
      {
        path: '/test/file1.txt',
        name: 'file1.txt',
        extension: 'txt',
        kindLabel: 'Text document',
        size: 1024,
        sizeLabel: '1 KB',
        dateModified: new Date(),
        dateModifiedLabel: 'Jan 1, 2024',
        status: 'available'
      }
    ],
    isLoading: false,
    fileCount: 1,
    folderCount: 1,
    isTruncated: false,
  };

  const defaultProps = {
    listing: mockListing,
    favorites: [],
    selectedPaths: {},
    lastClickedPath: null,
    focusedPath: null,
    onSelectFolder: vi.fn(),
    onSelectItem: vi.fn(),
    onSelectRange: vi.fn(),
    onFocusItem: vi.fn(),
    onToggleSelection: vi.fn(),
    onAddFavorite: vi.fn(),
    onRemoveFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no items', () => {
    render(<FileListView {...defaultProps} listing={{ ...mockListing, folders: [], files: [], folderCount: 0, fileCount: 0 }} />);
    expect(screen.getByText('No items found in this folder.')).toBeDefined();
  });

  it('renders folders and files', () => {
    render(<FileListView {...defaultProps} />);
    expect(screen.getByText('folder1')).toBeDefined();
    expect(screen.getByText('file1.txt')).toBeDefined();
  });

  it('calls onSelectItem when a file is clicked', () => {
    render(<FileListView {...defaultProps} />);
    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.click(fileButton!);

    expect(defaultProps.onSelectItem).toHaveBeenCalled();
    expect(defaultProps.onFocusItem).toHaveBeenCalled();
  });

  it('calls onSelectFolder when a folder is double clicked', () => {
    render(<FileListView {...defaultProps} />);
    const folderButton = screen.getByText('folder1').closest('button');
    fireEvent.doubleClick(folderButton!);

    expect(defaultProps.onSelectFolder).toHaveBeenCalledWith('/test/folder1');
  });

  it('supports meta/ctrl click for toggle selection', () => {
    render(<FileListView {...defaultProps} />);
    const fileButton = screen.getByText('file1.txt').closest('button');

    fireEvent.click(fileButton!, { metaKey: true });
    expect(defaultProps.onToggleSelection).toHaveBeenCalled();

    vi.clearAllMocks();
    fireEvent.click(fileButton!, { ctrlKey: true });
    expect(defaultProps.onToggleSelection).toHaveBeenCalled();
  });

  it('supports shift click for range selection', () => {
    // Add another file to act as the anchor
    const extendedListing: FolderListing = {
      ...mockListing,
      files: [
        ...mockListing.files,
        {
          path: '/test/last.txt',
          name: 'last.txt',
          extension: 'txt',
          kindLabel: 'Text',
          sizeLabel: '',
          size: 0,
          dateModified: null,
          dateModifiedLabel: '',
          status: 'available'
        }
      ]
    };

    render(<FileListView
      {...defaultProps}
      listing={extendedListing}
      lastClickedPath="/test/last.txt"
    />);

    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.click(fileButton!, { shiftKey: true });

    expect(defaultProps.onSelectRange).toHaveBeenCalled();
    expect(defaultProps.onFocusItem).toHaveBeenCalled();
  });

  it('adds Add to Favorites for non-favorited folders', () => {
    render(<FileListView {...defaultProps} />);
    const folderButton = screen.getByText('folder1').closest('button');
    fireEvent.contextMenu(folderButton!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const addItem = menuItems.find((item: { id?: string }) => item.id === 'add-to-favorites') as ContextMenuItemAction | undefined;
    expect(addItem).toBeDefined();
    expect(addItem?.enabled).toBe(true);
    addItem?.action();
    expect(defaultProps.onAddFavorite).toHaveBeenCalledWith('/test/folder1');
  });

  it('disables Remove from Favorites for built-in favorites', () => {
    const favorites: FavoriteLocationItem[] = [
      {
        path: '/test/folder1',
        name: 'folder1',
        kind: 'favorite',
        favoriteType: 'home',
        status: 'available',
      },
    ];

    render(<FileListView {...defaultProps} favorites={favorites} />);
    const folderButton = screen.getByText('folder1').closest('button');
    fireEvent.contextMenu(folderButton!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const removeItem = menuItems.find((item: { id?: string }) => item.id === 'remove-from-favorites');
    expect(removeItem).toBeDefined();
    expect(removeItem.enabled).toBe(false);
  });

  it('enables Remove from Favorites for custom favorites', () => {
    const favorites: FavoriteLocationItem[] = [
      {
        path: '/test/folder1',
        name: 'folder1',
        kind: 'favorite',
        favoriteType: 'custom',
        status: 'available',
      },
    ];

    render(<FileListView {...defaultProps} favorites={favorites} />);
    const folderButton = screen.getByText('folder1').closest('button');
    fireEvent.contextMenu(folderButton!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const removeItem = menuItems.find((item: { id?: string }) => item.id === 'remove-from-favorites') as ContextMenuItemAction | undefined;
    expect(removeItem).toBeDefined();
    expect(removeItem?.enabled).toBe(true);
    removeItem?.action();
    expect(defaultProps.onRemoveFavorite).toHaveBeenCalledWith('/test/folder1');
  });

  it('does not include favorites actions for file items', () => {
    render(<FileListView {...defaultProps} />);
    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.contextMenu(fileButton!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const addItem = menuItems.find((item: { id?: string }) => item.id === 'add-to-favorites');
    const removeItem = menuItems.find((item: { id?: string }) => item.id === 'remove-from-favorites');
    expect(addItem).toBeUndefined();
    expect(removeItem).toBeUndefined();
  });
});
