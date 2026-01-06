import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsSidebarSection } from '../CollectionsSidebarSection';
import { useCollections } from '../../hooks/use-collections';

// Mock useCollections hook
vi.mock('../../hooks/use-collections');

describe('CollectionsSidebarSection', () => {
  const mockCollections = [
    { id: 1, name: 'Vacation', created_at: '', updated_at: '' },
    { id: 2, name: 'Work', created_at: '', updated_at: '' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: true,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection onSelectCollection={vi.fn()} />);
    expect(screen.getByText('Loading collections...')).toBeDefined();
  });

  it('renders collections list', () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection onSelectCollection={vi.fn()} />);
    expect(screen.getByText('Collections')).toBeDefined();
    expect(screen.getByText('Vacation')).toBeDefined();
    expect(screen.getByText('Work')).toBeDefined();
  });

  it('calls onSelectCollection when clicked', () => {
    const onSelect = vi.fn();
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection onSelectCollection={onSelect} />);
    
    fireEvent.click(screen.getByText('Vacation'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('renders nothing if no collections', () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    const { container } = render(<CollectionsSidebarSection onSelectCollection={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
