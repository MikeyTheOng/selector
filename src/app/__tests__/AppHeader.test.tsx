import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from '../AppHeader';
import type { AppRoute } from '@/types/navigation';

// Mock the navigation hook to control the route
vi.mock('@/hooks/use-navigation.tsx', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/use-navigation.tsx')>('@/hooks/use-navigation.tsx');
  return {
    ...actual,
    useNavigation: vi.fn(),
  };
});

// Mock the toolbar components
vi.mock('@/components/explorer/ExplorerToolbar', () => ({
  ExplorerToolbar: () => <div data-testid="explorer-toolbar">Explorer Toolbar</div>,
}));

vi.mock('@/features/collections/components/CollectionToolbar', () => ({
  CollectionToolbar: () => <div data-testid="collection-toolbar">Collection Toolbar</div>,
}));

import { useNavigation } from '@/hooks/use-navigation.tsx';

describe('AppHeader', () => {
  it('renders ExplorerToolbar when current route is explorer', () => {
    const mockRoute: AppRoute = { type: 'explorer', folderId: '/test/path' };
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: mockRoute,
      navigateToExplorer: vi.fn(),
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });

    render(<AppHeader />);
    expect(screen.getByTestId('explorer-toolbar')).toBeDefined();
    expect(screen.getByText('Explorer Toolbar')).toBeDefined();
  });

  it('renders CollectionToolbar when current route is collection', () => {
    const mockRoute: AppRoute = { type: 'collection', collectionId: 'col-123' };
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: mockRoute,
      navigateToExplorer: vi.fn(),
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });

    render(<AppHeader />);
    expect(screen.getByTestId('collection-toolbar')).toBeDefined();
    expect(screen.getByText('Collection Toolbar')).toBeDefined();
  });

  it('does not render both toolbars simultaneously', () => {
    const mockRoute: AppRoute = { type: 'explorer', folderId: null };
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: mockRoute,
      navigateToExplorer: vi.fn(),
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });

    render(<AppHeader />);
    expect(screen.getByTestId('explorer-toolbar')).toBeDefined();
    expect(screen.queryByTestId('collection-toolbar')).toBeNull();
  });
});
