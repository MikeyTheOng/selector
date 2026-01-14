import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileListView } from '../FileListView';
import type { FolderListing } from '@/types/explorer';

// Simple mock for FileRowLabel
vi.mock('../FileRowLabel', () => ({
  FileRowLabel: ({ name }: { name: string }) => <div>{name}</div>,
}));

describe('FileListView', () => {
  const mockListing: FolderListing = {
    folders: [
      { path: '/test/folder1', name: 'folder1', dateModified: new Date(), dateModifiedLabel: 'Jan 1, 2024', status: 'available' }
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
    selectedPaths: {},
    lastClickedPath: null,
    focusedPath: null,
    onSelectFolder: vi.fn(),
    onSelectItem: vi.fn(),
    onSelectRange: vi.fn(),
    onFocusItem: vi.fn(),
    onToggleSelection: vi.fn(),
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
});