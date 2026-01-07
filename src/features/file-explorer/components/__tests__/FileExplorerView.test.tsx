import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileExplorerView } from '../FileExplorerView';
import { useExplorerContext } from '../../context/ExplorerContext';
import { listen, type EventCallback } from '@tauri-apps/api/event';
import type { FileRow, FolderListing } from '@/types/fs';

// Mock the context
vi.mock('../../context/ExplorerContext');
vi.mock('@tauri-apps/api/event');

describe('FileExplorerView Integration', () => {
  const mockToggleFileSelection = vi.fn();
  const mockFocusFile = vi.fn();
  const mockTogglePreview = vi.fn();
  const mockClosePreview = vi.fn();

  const mockFiles: FileRow[] = [
    {
      path: '/test/file1.txt',
      name: 'file1.txt',
      extension: 'txt',
      kindLabel: 'Text',
      size: 1024,
      sizeLabel: '1024 B',
      dateModified: new Date(),
      dateModifiedLabel: '',
    },
    {
      path: '/test/file2.txt',
      name: 'file2.txt',
      extension: 'txt',
      kindLabel: 'Text',
      size: 2048,
      sizeLabel: '2048 B',
      dateModified: new Date(),
      dateModifiedLabel: '',
    },
  ];

  const mockListing: FolderListing = {
    folders: [],
    files: mockFiles,
    isLoading: false,
    fileCount: 2,
    folderCount: 0,
    isTruncated: false,
  };

  type QuickLookNavigatePayload = {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
  };

  const defaultProps = {
    locations: [],
    folderId: '/test',
    onSelectFolder: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const mockContextValue = {
      listing: mockListing,
      ensureListing: vi.fn(),
      getListingForPath: vi.fn(),
      selectedFiles: {},
      selectedEntries: [],
      selectedCount: 0,
      lastClickedFile: null,
      focusedFile: { file: mockFiles[0] },
      selectFile: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      toggleFileSelection: mockToggleFileSelection,
      removeSelection: vi.fn(),
      clearSelections: vi.fn(),
      updateLastClickedFile: vi.fn(),
      clearLastClickedFile: vi.fn(),
      focusFile: mockFocusFile,
      clearFocus: vi.fn(),
      isPreviewActive: true,
      togglePreview: mockTogglePreview,
      updatePreview: vi.fn(),
      closePreview: mockClosePreview,
      viewMode: 'list' as const,
      setViewMode: vi.fn(),
      isSelectionOpen: false,
      setIsSelectionOpen: vi.fn(),
      folderId: '/test',
      locations: [],
    };

    vi.mocked(useExplorerContext).mockReturnValue(mockContextValue as unknown as ReturnType<typeof useExplorerContext>);

    vi.mocked(listen).mockResolvedValue(() => { });
  });

  it('handles quicklook://navigate event for selection toggle (Cmd+Enter)', async () => {
    let eventCallback: EventCallback<unknown> = () => { };
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate event from Quick Look panel
    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Enter',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(mockToggleFileSelection).toHaveBeenCalledWith(mockListing.files[0]);
  });

  it('handles quicklook://navigate event for navigation (ArrowDown)', async () => {
    let eventCallback: EventCallback<unknown> = () => { };
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate ArrowDown from Quick Look panel
    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'ArrowDown',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    // ArrowDown when file1 is focused should focus file2
    expect(mockFocusFile).toHaveBeenCalledWith(mockListing.files[1]);
  });

  it('handles quicklook://navigate event for navigation (ArrowUp)', async () => {
    let eventCallback: EventCallback<unknown> = () => { };
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    // Focus second file
    const mockContextValue = {
      listing: mockListing,
      ensureListing: vi.fn(),
      getListingForPath: vi.fn(),
      selectedFiles: {},
      selectedEntries: [],
      selectedCount: 0,
      lastClickedFile: null,
      focusedFile: { file: mockFiles[1] },
      selectFile: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      toggleFileSelection: mockToggleFileSelection,
      removeSelection: vi.fn(),
      clearSelections: vi.fn(),
      updateLastClickedFile: vi.fn(),
      clearLastClickedFile: vi.fn(),
      focusFile: mockFocusFile,
      clearFocus: vi.fn(),
      isPreviewActive: true,
      togglePreview: mockTogglePreview,
      updatePreview: vi.fn(),
      closePreview: mockClosePreview,
      viewMode: 'list' as const,
      setViewMode: vi.fn(),
      isSelectionOpen: false,
      setIsSelectionOpen: vi.fn(),
      folderId: '/test',
      locations: [],
    };
    vi.mocked(useExplorerContext).mockReturnValue(mockContextValue as unknown as ReturnType<typeof useExplorerContext>);

    render(<FileExplorerView {...defaultProps} />);

    // Simulate ArrowUp from Quick Look panel
    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'ArrowUp',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    // ArrowUp when file2 is focused should focus file1
    expect(mockFocusFile).toHaveBeenCalledWith(mockListing.files[0]);
  });

  it('handles quicklook://navigate event for closing preview (Escape)', async () => {
    let eventCallback: EventCallback<unknown> = () => { };
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate Escape from Quick Look panel
    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Escape',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(mockClosePreview).toHaveBeenCalled();
  });

  it('handles quicklook://navigate event for toggling preview (Space)', async () => {
    let eventCallback: EventCallback<unknown> = () => { };
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => { });
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate Space from Quick Look panel
    await act(async () => {
      eventCallback({
        event: 'quicklook://navigate',
        id: 0,
        payload: {
          key: 'Space',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        } satisfies QuickLookNavigatePayload,
      });
    });

    expect(mockTogglePreview).toHaveBeenCalledWith(mockListing.files[0].path);
  });
});