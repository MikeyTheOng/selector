import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileExplorerView } from '../FileExplorerView';
import { useExplorerContext } from '../../context/ExplorerContext';
import { useNavigation } from '@/hooks/use-navigation';
import { listen } from '@tauri-apps/api/event';
import type { FolderListing, ExplorerFileItem } from '@/types/explorer';
import type { ExplorerSelectionPanelProps } from '@/components/explorer/ExplorerSelectionPanel';

// Mock the context
vi.mock('../../context/ExplorerContext');
vi.mock('@/hooks/use-navigation');
vi.mock('@tauri-apps/api/event');

describe('FileExplorerView Integration', () => {
  const mockToggleSelection = vi.fn();
  const mockFocusItem = vi.fn();
  const mockTogglePreview = vi.fn();
  const mockClosePreview = vi.fn();

  const TestSelectionPanel = ({ selectedCount }: ExplorerSelectionPanelProps) => (
    <button type="button" disabled={selectedCount === 0}>
      {selectedCount} selected
    </button>
  );

  const mockFiles: ExplorerFileItem[] = [
    {
      path: '/test/file1.txt',
      name: 'file1.txt',
      kind: 'file',
      extension: 'txt',
      kindLabel: 'Text',
      size: 1024,
      sizeLabel: '1024 B',
      dateModified: new Date(),
      dateModifiedLabel: '',
      status: 'available',
    },
    {
      path: '/test/file2.txt',
      name: 'file2.txt',
      kind: 'file',
      extension: 'txt',
      kindLabel: 'Text',
      size: 2048,
      sizeLabel: '2048 B',
      dateModified: new Date(),
      dateModifiedLabel: '',
      status: 'available',
    },
  ];

  // We need to match FolderListing shape which uses FileRow/FolderRow, but in tests we can cast or mock
  const mockListing: FolderListing = {
    folders: [],
    files: mockFiles, 
    isLoading: false,
    fileCount: 2,
    folderCount: 0,
    isTruncated: false,
  };

  const defaultProps = {
    locations: [],
    favorites: [],
    folderId: '/test',
    onSelectFolder: vi.fn(),
    onAddFavorite: vi.fn(),
    onRemoveFavorite: vi.fn(),
    SelectionPanel: TestSelectionPanel,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockContextValue = {
      listing: mockListing,
      ensureListing: vi.fn(),
      getListingForPath: vi.fn(),
      selectedPaths: {},
      selectedEntries: [],
      selectedCount: 0,
      lastClickedPath: null,
      focusedPath: mockFiles[0].path,
      selectItem: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      toggleSelection: mockToggleSelection,
      removeSelection: vi.fn(),
      clearSelections: vi.fn(),
      updateLastClickedItem: vi.fn(),
      clearLastClickedItem: vi.fn(),
      focusItem: mockFocusItem,
      clearFocus: vi.fn(),
      isPreviewActive: true,
      togglePreview: mockTogglePreview,
      closePreview: mockClosePreview,
      viewMode: 'list' as const,
      setViewMode: vi.fn(),
      folderId: '/test',
      locations: [],
    };

    vi.mocked(useExplorerContext).mockReturnValue(mockContextValue as unknown as ReturnType<typeof useExplorerContext>);

    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: 'explorer', folderId: '/test' },
      navigateToExplorer: vi.fn(),
      navigateToCollection: vi.fn(),
      canGoBack: true,
      canGoForward: true,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });

    vi.mocked(listen).mockResolvedValue(() => { });
  });

  it('renders toolbar with correct file count', () => {
    render(<FileExplorerView {...defaultProps} />);
    // The toolbar displays "X files - Y folders"
    expect(screen.getByText(/2 files/)).toBeDefined();
  });

  it('disables selection trigger when no items are selected', () => {
    render(<FileExplorerView {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: /selected/i });
    expect(trigger).toBeDisabled();
  });

  it('renders selection panel with selected count', () => {
    const mockContextValue = {
      listing: mockListing,
      ensureListing: vi.fn(),
      getListingForPath: vi.fn(),
      selectedPaths: {},
      selectedEntries: mockFiles,
      selectedCount: 2,
      lastClickedPath: null,
      focusedPath: mockFiles[0].path,
      selectItem: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      toggleSelection: mockToggleSelection,
      removeSelection: vi.fn(),
      clearSelections: vi.fn(),
      updateLastClickedItem: vi.fn(),
      clearLastClickedItem: vi.fn(),
      focusItem: mockFocusItem,
      clearFocus: vi.fn(),
      isPreviewActive: true,
      togglePreview: mockTogglePreview,
      closePreview: mockClosePreview,
      viewMode: 'list' as const,
      setViewMode: vi.fn(),
      folderId: '/test',
      locations: [],
    };
    vi.mocked(useExplorerContext).mockReturnValue(mockContextValue as unknown as ReturnType<typeof useExplorerContext>);

    render(<FileExplorerView {...defaultProps} />);

    expect(screen.getByText('2 selected')).toBeDefined();
  });
});
