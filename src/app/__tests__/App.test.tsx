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
vi.mock('@/features/file-explorer/components/FileExplorerView', () => ({
  FileExplorerView: vi.fn(() => <div data-testid="explorer-view">Explorer View</div>)
}));

vi.mock('@/features/collections/components/CollectionsView', () => ({
  CollectionsView: ({ collectionId }: { collectionId: string }) => (
    <div data-testid="collections-view">Collections View: {collectionId}</div>
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
      locations: [],
      isLoading: false,
      error: null,
      homePath: '/home/user',
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

  it('renders explorer view by default', () => {
    renderApp();
    expect(screen.getByTestId('explorer-view')).toBeDefined();
  });

  it('renders collections view when route is collection', async () => {
    // We need to trigger navigation. Since App wraps everything in NavigationProvider,
    // we can't easily inject a trigger from outside without duplicating providers.
    // Instead, we can mock one of the components that App renders to include a trigger.
    
    // We'll use the already mocked FileExplorerView as a trigger
    const { FileExplorerView } = await import('@/features/file-explorer/components/FileExplorerView');
    vi.mocked(FileExplorerView).mockImplementation(() => {
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

    expect(screen.getByTestId('collections-view')).toBeDefined();
    expect(screen.getByText(/Collections View: 5/i)).toBeDefined();
  });
});
