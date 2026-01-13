import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsSidebar } from '../LocationsSidebar';
import { useNavigation } from '@/hooks/use-navigation';
import type { LocationItem } from '@/types/explorer';

vi.mock('@/hooks/use-navigation');

describe('LocationsSidebar', () => {
  const mockLocations: LocationItem[] = [
    { path: '/Users/test', name: 'Home', kind: 'home' },
    { path: '/Volumes/Drive', name: 'Drive', kind: 'volume' }
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
    locations: mockLocations,
    locationsError: null,
  };

  it('renders home location', () => {
    render(<LocationsSidebar {...defaultProps} />);
    expect(screen.getByText('Favorites')).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
  });

  it('renders volume locations', () => {
    render(<LocationsSidebar {...defaultProps} />);
    expect(screen.getByText('Locations')).toBeDefined();
    expect(screen.getByText('Drive')).toBeDefined();
  });

  it('calls navigateToExplorer when location clicked', () => {
    render(<LocationsSidebar {...defaultProps} />);
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigateToExplorer).toHaveBeenCalledWith('/Users/test');
  });

  it('renders collections slot when provided', () => {
    const renderCollections = () => <div data-testid="collections-slot">My Collections</div>;
    render(<LocationsSidebar {...defaultProps} renderCollections={renderCollections} />);
    expect(screen.getByTestId('collections-slot')).toBeDefined();
    expect(screen.getByText('My Collections')).toBeDefined();
  });
});
