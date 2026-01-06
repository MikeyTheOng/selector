import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddToCollectionWidget } from '../AddToCollectionWidget';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { FileRow } from '@/types/fs';

// Mock the hooks
vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');

// Mock ResizeObserver for ScrollArea
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AddToCollectionWidget', () => {
  const user = userEvent.setup();
  const mockSelectedEntries: FileRow[] = [
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

  const mockCollections = [
    { id: 1, name: 'Collection 1', created_at: '', updated_at: '' },
    { id: 2, name: 'Collection 2', created_at: '', updated_at: '' }
  ];

  const mockCreateCollection = vi.fn().mockResolvedValue(mockCollections[0]);
  const mockAddItem = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: mockCreateCollection,
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
    vi.mocked(useCollectionItems).mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      addItem: mockAddItem,
      removeItem: vi.fn(),
      refetch: vi.fn(),
      relinkItem: vi.fn(),
      relinkFolder: vi.fn(),
    });
  });

  it('renders trigger button correctly', () => {
    render(<AddToCollectionWidget selectedEntries={mockSelectedEntries} />);
    expect(screen.getByText('Add to Collection...')).toBeDefined();
  });

  it('opens dialog when trigger is clicked', async () => {
    render(<AddToCollectionWidget selectedEntries={mockSelectedEntries} />);
    
    const trigger = screen.getByText('Add to Collection...');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Existing Collections')).toBeDefined();
      expect(screen.getByText('Collection 1')).toBeDefined();
    });
  });

  it('adds items to an existing collection', async () => {
    render(<AddToCollectionWidget selectedEntries={mockSelectedEntries} />);
    
    await user.click(screen.getByText('Add to Collection...'));

    await waitFor(() => {
      screen.getByText('Collection 1');
    });
    
    const collectionButton = screen.getByText('Collection 1');
    await user.click(collectionButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalled();
    });
  });

  it('creates a new collection and adds items to it', async () => {
    render(<AddToCollectionWidget selectedEntries={mockSelectedEntries} />);
    
    await user.click(screen.getByText('Add to Collection...'));

    await waitFor(() => {
      screen.getByPlaceholderText('New collection name...');
    });
    
    const input = screen.getByPlaceholderText('New collection name...');
    await user.type(input, 'New Coll');
    
    const createButton = screen.getByLabelText('Create new collection');
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateCollection).toHaveBeenCalledWith({ name: 'New Coll' });
      expect(mockAddItem).toHaveBeenCalled();
    });
  });
});