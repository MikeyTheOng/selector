import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsSidebar } from '../LocationsSidebar';
import { useNavigation } from '@/hooks/use-navigation';
import type { LocationItem } from '@/types/explorer';
import type { FavoriteLocationItem } from '../../types';
import { toast } from 'sonner';

const showContextMenu = vi.fn();

vi.mock('@/components/explorer/ExplorerContextMenu', () => ({
  useExplorerContextMenu: () => ({ showContextMenu }),
}));

vi.mock('@/hooks/use-navigation');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('LocationsSidebar', () => {
  const mockFavorites: FavoriteLocationItem[] = [
    { path: '/Users/test', name: 'Home', kind: 'favorite', favoriteType: 'home', status: 'available' },
    { path: '/Users/test/Pictures', name: 'Pictures', kind: 'favorite', favoriteType: 'pictures', status: 'available' },
  ];

  const mockVolumes: LocationItem[] = [
    { path: '/Volumes/Drive', name: 'Drive', kind: 'volume' },
  ];

  const mockNavigateToExplorer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: 'explorer', folderId: null },
      navigateToExplorer: mockNavigateToExplorer,
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });
  });

  const defaultProps = {
    favorites: mockFavorites,
    volumes: mockVolumes,
    onRemoveFavorite: vi.fn(),
  };

  it('renders favorites section with all favorites', () => {
    render(<LocationsSidebar {...defaultProps} />);
    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Pictures')).toBeDefined();
  });

  it('renders volume locations', () => {
    render(<LocationsSidebar {...defaultProps} />);
    expect(screen.getByText('Locations')).toBeDefined();
    expect(screen.getByText('Drive')).toBeDefined();
  });

  it('calls navigateToExplorer when favorite clicked', () => {
    render(<LocationsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Users/test');
  });

  it('shows toast and does not navigate for missing favorite', () => {
    const missingFavorites: FavoriteLocationItem[] = [
      { path: '/Missing', name: 'Missing', kind: 'favorite', favoriteType: 'custom', status: 'missing' },
    ];

    render(<LocationsSidebar favorites={missingFavorites} volumes={mockVolumes} onRemoveFavorite={vi.fn()} />);
    fireEvent.click(screen.getByText('Missing'));

    expect(mockNavigateToExplorer).not.toHaveBeenCalled();
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
  });

  it('shows context menu with remove disabled for built-in favorites', () => {
    render(<LocationsSidebar {...defaultProps} />);
    fireEvent.contextMenu(screen.getByText('Home').closest('button')!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const removeItem = menuItems.find((item: { id?: string }) => item.id === 'remove-favorite');
    expect(removeItem).toBeDefined();
    expect(removeItem.enabled).toBe(false);
  });

  it('shows context menu with remove enabled for custom favorites', () => {
    const customFavorites: FavoriteLocationItem[] = [
      { path: '/Custom', name: 'Custom', kind: 'favorite', favoriteType: 'custom', status: 'available' },
    ];

    render(<LocationsSidebar favorites={customFavorites} volumes={mockVolumes} onRemoveFavorite={vi.fn()} />);
    fireEvent.contextMenu(screen.getByText('Custom').closest('button')!);

    const menuItems = showContextMenu.mock.calls[0][0];
    const removeItem = menuItems.find((item: { id?: string }) => item.id === 'remove-favorite');
    expect(removeItem).toBeDefined();
    expect(removeItem.enabled).toBe(true);
  });

  it('calls navigateToExplorer when volume clicked', () => {
    render(<LocationsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Drive'));
    expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Volumes/Drive');
  });

  it('shows empty state when no volumes', () => {
    render(<LocationsSidebar favorites={mockFavorites} volumes={[]} onRemoveFavorite={vi.fn()} />);
    expect(screen.getByText('No mounted locations found.')).toBeDefined();
  });

  it('hides favorites section when no favorites', () => {
    render(<LocationsSidebar favorites={[]} volumes={mockVolumes} onRemoveFavorite={vi.fn()} />);
    expect(screen.queryByText('Favorites')).toBeNull();
  });

  it('renders collections slot when provided', () => {
    const renderCollections = () => <div data-testid="collections-slot">My Collections</div>;
    render(<LocationsSidebar {...defaultProps} renderCollections={renderCollections} />);
    expect(screen.getByTestId('collections-slot')).toBeDefined();
    expect(screen.getByText('My Collections')).toBeDefined();
  });
});
