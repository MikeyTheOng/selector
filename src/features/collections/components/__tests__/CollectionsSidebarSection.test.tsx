import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionsSidebarSection } from '../CollectionsSidebarSection';
import { useCollections } from '../../hooks/use-collections';
import { useNavigation } from '@/hooks/use-navigation';

// Mock useCollections hook
vi.mock('../../hooks/use-collections');
vi.mock('@/hooks/use-navigation');

describe('CollectionsSidebarSection', () => {
  const mockCollections = [
    { id: 1, name: 'Vacation', created_at: '', updated_at: '' },
    { id: 2, name: 'Work', created_at: '', updated_at: '' }
  ];

  const mockNavigateToCollection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: 'explorer', folderId: null },
      navigateToExplorer: vi.fn(),
      navigateToCollection: mockNavigateToCollection,
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });
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

    render(<CollectionsSidebarSection />);
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

    render(<CollectionsSidebarSection />);
    expect(screen.getByText('Collections')).toBeDefined();
    expect(screen.getByText('Vacation')).toBeDefined();
    expect(screen.getByText('Work')).toBeDefined();
  });

  it('calls navigateToCollection when clicked', () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    
    fireEvent.click(screen.getByText('Vacation'));
    expect(mockNavigateToCollection).toHaveBeenCalledWith('1');
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

    const { container } = render(<CollectionsSidebarSection />);
    expect(container.firstChild).toBeNull();
  });
});
