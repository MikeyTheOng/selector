import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsSidebar } from '../LocationsSidebar';
import { useNavigation } from '@/hooks/use-navigation';
import type { LocationItem } from '@/types/explorer';

vi.mock('@/hooks/use-navigation');

describe('LocationsSidebar', () => {
  const mockFavorites: LocationItem[] = [
    { path: '/Users/test', name: 'Home', kind: 'favorite' },
    { path: '/Users/test/Pictures', name: 'Pictures', kind: 'favorite' },
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

  it('calls navigateToExplorer when volume clicked', () => {
    render(<LocationsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Drive'));
    expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Volumes/Drive');
  });

  it('shows empty state when no volumes', () => {
    render(<LocationsSidebar favorites={mockFavorites} volumes={[]} />);
    expect(screen.getByText('No mounted locations found.')).toBeDefined();
  });

  it('hides favorites section when no favorites', () => {
    render(<LocationsSidebar favorites={[]} volumes={mockVolumes} />);
    expect(screen.queryByText('Favorites')).toBeNull();
  });

  it('renders collections slot when provided', () => {
    const renderCollections = () => <div data-testid="collections-slot">My Collections</div>;
    render(<LocationsSidebar {...defaultProps} renderCollections={renderCollections} />);
    expect(screen.getByTestId('collections-slot')).toBeDefined();
    expect(screen.getByText('My Collections')).toBeDefined();
  });
});
