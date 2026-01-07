import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserToolbar } from '../BrowserToolbar';

describe('BrowserToolbar', () => {
  const defaultProps = {
    currentFolderName: 'Test Folder',
    viewMode: 'list' as const,
    onViewModeChange: vi.fn(),
    fileCount: 10,
    folderCount: 5,
    selectedCount: 2,
    isSelectionOpen: false,
    onToggleSelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current folder name', () => {
    render(<BrowserToolbar {...defaultProps} />);
    expect(screen.getByText('Test Folder')).toBeDefined();
  });

  it('displays correct counts', () => {
    render(<BrowserToolbar {...defaultProps} />);
    expect(screen.getByText('10 files - 5 folders')).toBeDefined();
    expect(screen.getByText('2 selected')).toBeDefined();
  });

  it('handles view mode change', () => {
    render(<BrowserToolbar {...defaultProps} />);

    const columnButton = screen.getByText('Column');
    fireEvent.click(columnButton);

    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('column');
  });

  it('calls onToggleSelection when selection button is clicked', () => {
    render(<BrowserToolbar {...defaultProps} />);
    const selectionButton = screen.getByText('2 selected');
    fireEvent.click(selectionButton);
    expect(defaultProps.onToggleSelection).toHaveBeenCalled();
  });
});
