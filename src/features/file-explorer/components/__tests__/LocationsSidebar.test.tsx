import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationsSidebar } from '../LocationsSidebar';
import type { LocationItem } from '@/types/fs';

describe('LocationsSidebar', () => {
  const mockLocations: LocationItem[] = [
    { path: '/Users/test', name: 'Home', kind: 'home' },
    { path: '/Volumes/Drive', name: 'Drive', kind: 'volume' }
  ];

  const defaultProps = {
    locations: mockLocations,
    locationsError: null,
    selectedFolder: null,
    onSelectFolder: vi.fn(),
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

  it('renders collections slot when provided', () => {
    const renderCollections = () => <div data-testid="collections-slot">My Collections</div>;
    render(<LocationsSidebar {...defaultProps} renderCollections={renderCollections} />);
    expect(screen.getByTestId('collections-slot')).toBeDefined();
    expect(screen.getByText('My Collections')).toBeDefined();
  });
});
