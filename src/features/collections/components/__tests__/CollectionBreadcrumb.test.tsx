import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionBreadcrumb } from '../CollectionBreadcrumb';
import { useCollections } from '../../hooks/use-collections';

vi.mock('../../hooks/use-collections');

describe('CollectionBreadcrumb', () => {
  const mockCollections = [
    { id: 1, name: 'My Collection', created_at: '', updated_at: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it('renders "Collections" root and collection name', () => {
    render(<CollectionBreadcrumb collectionId={1} />);
    expect(screen.getByText('Collections')).toBeDefined();
    expect(screen.getByText('My Collection')).toBeDefined();
  });

  it('renders "Loading..." if collection is not found', () => {
    render(<CollectionBreadcrumb collectionId={999} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });
});
