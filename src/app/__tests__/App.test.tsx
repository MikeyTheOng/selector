import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { useNavigation } from '@/hooks/use-navigation';
import { useLocations } from '@/features/file-explorer/hooks/use-locations';
import { useCollections } from '@/features/collections/hooks/use-collections';

// Mock locations
vi.mock('@/features/file-explorer/hooks/use-locations');
vi.mock('@/features/collections/hooks/use-collections');

// Mock child components to keep integration test focused on routing
vi.mock('@/features/file-explorer/components/FileExplorerPage', () => ({
  FileExplorerPage: vi.fn(() => <div data-testid="explorer-page">Explorer Page</div>)
}));

vi.mock('@/features/collections/components/CollectionsPage', () => ({
  CollectionsPage: ({ collectionId }: { collectionId: string }) => (
    <div data-testid="collections-page">Collections Page: {collectionId}</div>
  )
}));

// Mock CollectionsSidebarSection to avoid its internal logic/loading states
vi.mock('@/features/collections/components/CollectionsSidebarSection', () => ({
  CollectionsSidebarSection: () => <div data-testid="collections-sidebar">Collections Sidebar</div>
}));

describe('App Routing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLocations).mockReturnValue({
      favorites: [],
      volumes: [],
      rootLocations: [],
      error: null,
    });
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
  });

  const renderApp = () => {
    return render(<App />);
  };

  it('renders explorer page by default', () => {
    renderApp();
    expect(screen.getByTestId('explorer-page')).toBeDefined();
  });

  it('renders collections page when route is collection', async () => {
    const { FileExplorerPage } = await import('@/features/file-explorer/components/FileExplorerPage');
    vi.mocked(FileExplorerPage).mockImplementation(() => {
      const { navigateToCollection } = useNavigation();
      return (
        <button 
          data-testid="nav-button" 
          onClick={() => navigateToCollection('5')}
        >
          Go to Collection 5
        </button>
      );
    });

    renderApp();

    // Click navigation button
    const button = screen.getByTestId('nav-button');
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByTestId('collections-page')).toBeDefined();
    expect(screen.getByText(/Collections Page: 5/i)).toBeDefined();
  });
});