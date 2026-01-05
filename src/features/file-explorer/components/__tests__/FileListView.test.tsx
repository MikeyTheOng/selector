import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileListView } from '../FileListView';
import type { FolderListing, FileRow } from '@/types/fs';

// Simple mock for FileRowLabel
vi.mock('../FileRowLabel', () => ({
  FileRowLabel: ({ name }: { name: string }) => <div>{name}</div>,
}));

describe('FileListView', () => {
  const mockListing: FolderListing = {
    folders: [
      { path: '/test/folder1', name: 'folder1', dateModified: new Date(), dateModifiedLabel: 'Jan 1, 2024' }
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
        dateModifiedLabel: 'Jan 1, 2024' 
      }
    ],
    isLoading: false,
    fileCount: 1,
    folderCount: 1,
    isTruncated: false,
  };

  const defaultProps = {
    listing: mockListing,
    selectedFiles: {},
    lastClickedFile: null,
    focusedFile: null,
    onSelectFolder: vi.fn(),
    onSelectFile: vi.fn(),
    onSelectRange: vi.fn(),
    onUpdateLastClickedFile: vi.fn(),
    onFocusFile: vi.fn(),
    onToggleFileSelection: vi.fn(),
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
    expect(screen.getByText('Text document')).toBeDefined();
  });

  it('calls onSelectFile when a file is clicked', () => {
    render(<FileListView {...defaultProps} />);
    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.click(fileButton!);
    
    expect(defaultProps.onSelectFile).toHaveBeenCalled();
    expect(defaultProps.onFocusFile).toHaveBeenCalled();
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
    expect(defaultProps.onToggleFileSelection).toHaveBeenCalled();
    
    vi.clearAllMocks();
    fireEvent.click(fileButton!, { ctrlKey: true });
    expect(defaultProps.onToggleFileSelection).toHaveBeenCalled();
  });

  it('supports shift click for range selection', () => {
    const lastClicked: FileRow = { 
      path: '/test/last.txt', 
      name: 'last.txt', 
      extension: 'txt', 
      kindLabel: 'Text', 
      sizeLabel: '', 
      dateModified: null, 
      dateModifiedLabel: '' 
    };
    
    render(<FileListView 
      {...defaultProps} 
      lastClickedFile={{ file: lastClicked, index: 0 }} 
    />);
    
    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.click(fileButton!, { shiftKey: true });
    
    expect(defaultProps.onSelectRange).toHaveBeenCalled();
    expect(defaultProps.onFocusFile).toHaveBeenCalled();
  });
});
