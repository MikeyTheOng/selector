import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelectionSheet } from '../SelectionSheet';
import type { FileRow } from '@/types/fs';

describe('SelectionSheet', () => {
  const mockEntries: FileRow[] = [
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
  ];

  const defaultProps = {
    isOpen: true,
    entries: mockEntries,
    onClose: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  };

  it('renders entries', () => {
    render(<SelectionSheet {...defaultProps} />);
    expect(screen.getByText('file1.txt')).toBeDefined();
    expect(screen.getByText('/test/file1.txt')).toBeDefined();
  });

  it('calls onRemove when remove button clicked', () => {
    render(<SelectionSheet {...defaultProps} />);
    const removeButton = screen.getByLabelText('Remove file1.txt');
    fireEvent.click(removeButton);
    expect(defaultProps.onRemove).toHaveBeenCalledWith('/test/file1.txt');
  });

  it('renders actions using renderActions prop', () => {
    const renderActions = (entries: FileRow[]) => (
      <div data-testid="custom-actions">
        Custom Actions for {entries.length} items
      </div>
    );

    render(<SelectionSheet {...defaultProps} renderActions={renderActions} />);
    expect(screen.getByTestId('custom-actions')).toBeDefined();
    expect(screen.getByText('Custom Actions for 1 items')).toBeDefined();
  });
});
