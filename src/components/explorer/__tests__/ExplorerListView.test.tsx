import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExplorerListView } from '../ExplorerListView';
import type { ExplorerItem } from '@/types/explorer';

describe('ExplorerListView', () => {
  const mockItems: ExplorerItem[] = [
    {
      path: '/test/folder1',
      name: 'folder1',
      kind: 'folder',
      status: 'available',
      dateModified: new Date(),
      dateModifiedLabel: 'Jan 1, 2024',
    } as ExplorerItem,
    {
      path: '/test/file1.txt',
      name: 'file1.txt',
      kind: 'file',
      status: 'available',
      extension: 'txt',
      kindLabel: 'Text document',
      size: 1024,
      sizeLabel: '1 KB',
      dateModified: new Date(),
      dateModifiedLabel: 'Jan 1, 2024'
    } as ExplorerItem
  ];

  const defaultProps = {
    items: mockItems,
    viewMode: 'list' as const,
    selectedPaths: {},
    lastClickedPath: null,
    focusedPath: null,
    onItemClick: vi.fn(),
    onItemDoubleClick: vi.fn(),
    emptyMessage: 'No items found.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no items', () => {
    render(<ExplorerListView {...defaultProps} items={[]} />);
    expect(screen.getByText('No items found.')).toBeDefined();
  });

  it('renders items in list view', () => {
    render(<ExplorerListView {...defaultProps} />);
    expect(screen.getByText('folder1')).toBeDefined();
    expect(screen.getByText('file1.txt')).toBeDefined();
    expect(screen.getByText('Text document')).toBeDefined();
  });

  it('calls onItemClick when an item is clicked', () => {
    render(<ExplorerListView {...defaultProps} />);
    const fileButton = screen.getByText('file1.txt').closest('button');
    fireEvent.click(fileButton!);

    expect(defaultProps.onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test/file1.txt' }),
      expect.anything()
    );
  });

  it('calls onItemDoubleClick when an item is double clicked', () => {
    render(<ExplorerListView {...defaultProps} />);
    const folderButton = screen.getByText('folder1').closest('button');
    fireEvent.doubleClick(folderButton!);

    expect(defaultProps.onItemDoubleClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/test/folder1' })
    );
  });

  it('applies selected styles', () => {
    render(<ExplorerListView {...defaultProps} selectedPaths={{ '/test/file1.txt': mockItems[1] }} />);
    const fileButton = screen.getByText('file1.txt').closest('button');
    expect(fileButton?.getAttribute('aria-selected')).toBe('true');
    expect(fileButton?.className).toContain('bg-primary');
  });

  it('supports custom rendering for labels', () => {
    const renderLabel = vi.fn(({ item }) => <span>Custom {item.name}</span>);
    render(<ExplorerListView {...defaultProps} renderItemLabel={renderLabel} />);
    
    expect(screen.getByText('Custom folder1')).toBeDefined();
    expect(screen.getByText('Custom file1.txt')).toBeDefined();
  });

  it('dimmed missing/offline items', () => {
    const missingItems: ExplorerItem[] = [
      { ...mockItems[0], status: 'missing' } as ExplorerItem
    ];
    render(<ExplorerListView {...defaultProps} items={missingItems} />);
    const button = screen.getByText('folder1').closest('button');
    expect(button?.className).toContain('opacity-50');
  });
});
