import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserToolbar } from '../BrowserToolbar';
import { useExplorerContext } from '../../context/ExplorerContext';

vi.mock('../../context/ExplorerContext');

describe('BrowserToolbar', () => {
  const mockSetViewMode = vi.fn();
  const mockSetIsSelectionOpen = vi.fn();

  const mockContextValue = {
    folderId: '/test/Test Folder',
    viewMode: 'list' as const,
    setViewMode: mockSetViewMode,
    listing: {
      fileCount: 10,
      folderCount: 5,
      folders: [],
      files: [],
      isLoading: false,
      isTruncated: false,
    },
    selectedCount: 2,
    selectedFiles: new Set(),
    selectedEntries: [],
    lastClickedFile: null,
    focusedFile: null,
    isPreviewActive: false,
    isSelectionOpen: false,
    setIsSelectionOpen: mockSetIsSelectionOpen,
    locations: [],
    ensureListing: vi.fn(),
    getListingForPath: vi.fn(),
    selectFile: vi.fn(),
    selectMultiple: vi.fn(),
    selectRange: vi.fn(),
    toggleFileSelection: vi.fn(),
    removeSelection: vi.fn(),
    clearSelections: vi.fn(),
    clearLastClickedFile: vi.fn(),
    focusFile: vi.fn(),
    clearFocus: vi.fn(),
    togglePreview: vi.fn(),
    updatePreview: vi.fn(),
    closePreview: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExplorerContext).mockReturnValue(mockContextValue as unknown as ReturnType<typeof useExplorerContext>);
  });

  it('renders the current folder name', () => {
    render(<BrowserToolbar />);
    expect(screen.getByText('Test Folder')).toBeDefined();
  });

  it('displays correct counts', () => {
    render(<BrowserToolbar />);
    expect(screen.getByText('10 files - 5 folders')).toBeDefined();
    expect(screen.getByText('2 selected')).toBeDefined();
  });

  it('handles view mode change', () => {
    render(<BrowserToolbar />);

    const columnButton = screen.getByText('Column');
    fireEvent.click(columnButton);

    expect(mockSetViewMode).toHaveBeenCalledWith('column');
  });

  it('calls setIsSelectionOpen when selection button is clicked', () => {
    render(<BrowserToolbar />);
    const selectionButton = screen.getByText('2 selected');
    fireEvent.click(selectionButton);
    expect(mockSetIsSelectionOpen).toHaveBeenCalled();
  });
});
