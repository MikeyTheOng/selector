import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileExplorerView } from '../FileExplorerView';
import { useFolderListing } from '../../hooks/use-folder-listing';
import { useFileSelection } from '../../hooks/use-file-selection';
import { useQuickLook } from '../../hooks/use-quick-look';
import { listen } from '@tauri-apps/api/event';

// Mock the hooks
vi.mock('../../hooks/use-folder-listing');
vi.mock('../../hooks/use-file-selection');
vi.mock('../../hooks/use-quick-look');
vi.mock('@tauri-apps/api/event');

describe('FileExplorerView Integration', () => {
  const mockToggleFileSelection = vi.fn();
  const mockFocusFile = vi.fn();
  const mockTogglePreview = vi.fn();
  const mockClosePreview = vi.fn();

  const mockListing = {
    folders: [],
    files: [
      { path: '/test/file1.txt', name: 'file1.txt', size: 1024, kindLabel: 'Text', dateModified: new Date(), dateModifiedLabel: '' },
      { path: '/test/file2.txt', name: 'file2.txt', size: 2048, kindLabel: 'Text', dateModified: new Date(), dateModifiedLabel: '' }
    ],
    isLoading: false,
    fileCount: 2,
    folderCount: 0,
    isTruncated: false,
  };

  const defaultProps = {
    locations: [],
    locationsError: null,
    selectedFolder: '/test',
    onSelectFolder: vi.fn(),
    canGoBack: false,
    canGoForward: false,
    onBack: vi.fn(),
    onForward: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useFolderListing).mockReturnValue({
      listing: mockListing,
      ensureListing: vi.fn(),
      getListingForPath: vi.fn(),
    } as any);

    vi.mocked(useFileSelection).mockReturnValue({
      selectedFiles: {},
      selectedEntries: [],
      selectedCount: 0,
      focusedFile: { file: mockListing.files[0] },
      toggleFileSelection: mockToggleFileSelection,
      focusFile: mockFocusFile,
      clearFocus: vi.fn(),
      clearSelections: vi.fn(),
      clearLastClickedFile: vi.fn(),
      selectFile: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      removeSelection: vi.fn(),
    } as any);

    vi.mocked(useQuickLook).mockReturnValue({
      isPreviewActive: true,
      togglePreview: mockTogglePreview,
      updatePreview: vi.fn(),
      closePreview: mockClosePreview,
    } as any);

    vi.mocked(listen).mockResolvedValue(() => {});
  });

  it('handles quicklook://navigate event for selection toggle (Cmd+Enter)', async () => {
    let eventCallback: (event: any) => void = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate event from Quick Look panel
    await act(async () => {
      eventCallback({
        payload: {
          key: 'Enter',
          metaKey: true,
          ctrlKey: false,
          shiftKey: false,
        }
      });
    });

    expect(mockToggleFileSelection).toHaveBeenCalledWith(mockListing.files[0]);
  });

  it('handles quicklook://navigate event for navigation (ArrowDown)', async () => {
    let eventCallback: (event: any) => void = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate ArrowDown from Quick Look panel
    await act(async () => {
      eventCallback({
        payload: {
          key: 'ArrowDown',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        }
      });
    });

    // ArrowDown when file1 is focused should focus file2
    expect(mockFocusFile).toHaveBeenCalledWith(mockListing.files[1]);
  });

  it('handles quicklook://navigate event for navigation (ArrowUp)', async () => {
    let eventCallback: (event: any) => void = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    // Focus second file
    vi.mocked(useFileSelection).mockReturnValue({
      selectedFiles: {},
      selectedEntries: [],
      selectedCount: 0,
      focusedFile: { file: mockListing.files[1] },
      toggleFileSelection: mockToggleFileSelection,
      focusFile: mockFocusFile,
      clearFocus: vi.fn(),
      clearSelections: vi.fn(),
      clearLastClickedFile: vi.fn(),
      selectFile: vi.fn(),
      selectMultiple: vi.fn(),
      selectRange: vi.fn(),
      removeSelection: vi.fn(),
    } as any);

    render(<FileExplorerView {...defaultProps} />);

    // Simulate ArrowUp from Quick Look panel
    await act(async () => {
      eventCallback({
        payload: {
          key: 'ArrowUp',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        }
      });
    });

    // ArrowUp when file2 is focused should focus file1
    expect(mockFocusFile).toHaveBeenCalledWith(mockListing.files[0]);
  });

  it('handles quicklook://navigate event for closing preview (Escape)', async () => {
    let eventCallback: (event: any) => void = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate Escape from Quick Look panel
    await act(async () => {
      eventCallback({
        payload: {
          key: 'Escape',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        }
      });
    });

    expect(mockClosePreview).toHaveBeenCalled();
  });

  it('handles quicklook://navigate event for toggling preview (Space)', async () => {
    let eventCallback: (event: any) => void = () => {};
    vi.mocked(listen).mockImplementation((event, callback) => {
      if (event === 'quicklook://navigate') {
        eventCallback = callback;
      }
      return Promise.resolve(() => {});
    });

    render(<FileExplorerView {...defaultProps} />);

    // Simulate Space from Quick Look panel
    await act(async () => {
      eventCallback({
        payload: {
          key: 'Space',
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
        }
      });
    });

    expect(mockTogglePreview).toHaveBeenCalledWith(mockListing.files[0].path);
  });
});
