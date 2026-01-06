import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddToCollectionWidget } from '../AddToCollectionWidget';
import { useCollections } from '../../hooks/use-collections';
import { useCollectionItems } from '../../hooks/use-collection-items';
import type { FileRow } from '@/types/fs';

// Mock the hooks
vi.mock('../../hooks/use-collections');
vi.mock('../../hooks/use-collection-items');

describe('AddToCollectionWidget', () => {
  const mockSelectedFiles: Record<string, FileRow> = {
    '/test/file1.txt': {
      path: '/test/file1.txt',
      name: 'file1.txt',
      extension: 'txt',
      kindLabel: 'Text document',
      size: 1024,
      sizeLabel: '1 KB',
      dateModified: new Date(),
      dateModifiedLabel: 'Jan 1, 2024'
    }
  };

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
    // Default mock for useCollectionItems
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

  it('renders correctly', () => {
    render(<AddToCollectionWidget selectedFiles={mockSelectedFiles} />);
    expect(screen.getByText('Add to Collection')).toBeDefined();
    expect(screen.getByPlaceholderText('New collection name...')).toBeDefined();
  });

  it('shows existing collections', () => {
    render(<AddToCollectionWidget selectedFiles={mockSelectedFiles} />);
    expect(screen.getByText('Collection 1')).toBeDefined();
    expect(screen.getByText('Collection 2')).toBeDefined();
  });

  it('adds items to an existing collection', async () => {
    render(<AddToCollectionWidget selectedFiles={mockSelectedFiles} />);
    
    const collectionButton = screen.getByText('Collection 1');
    fireEvent.click(collectionButton);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalled();
    });
  });

  it('creates a new collection and adds items to it', async () => {
    render(<AddToCollectionWidget selectedFiles={mockSelectedFiles} />);
    
    const input = screen.getByPlaceholderText('New collection name...');
    fireEvent.change(input, { target: { value: 'New Coll' } });
    
    const createButton = screen.getByLabelText('Create new collection');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateCollection).toHaveBeenCalledWith({ name: 'New Coll' });
      // It should also add items to the newly created collection
      expect(mockAddItem).toHaveBeenCalled();
    });
  });
});
