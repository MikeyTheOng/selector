import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useNavigation, NavigationProvider } from '../use-navigation.tsx';
import type { ReactNode } from 'react';

describe('useNavigation', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NavigationProvider>{children}</NavigationProvider>
  );

  it('initializes with explorer route at root (null folderId)', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.currentRoute).toEqual({
      type: 'explorer',
      folderId: null,
    });
  });

  it('navigates to explorer with specific folder', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    act(() => {
      result.current.navigateToExplorer('/path/to/folder');
    });

    expect(result.current.currentRoute).toEqual({
      type: 'explorer',
      folderId: '/path/to/folder',
    });
  });

  it('navigates to collection view', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    act(() => {
      result.current.navigateToCollection('collection-123');
    });

    expect(result.current.currentRoute).toEqual({
      type: 'collection',
      collectionId: 'collection-123',
    });
  });

  it('maintains back/forward history for typed routes', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    // Navigate to folder
    act(() => {
      result.current.navigateToExplorer('/folder-a');
    });

    // Navigate to collection
    act(() => {
      result.current.navigateToCollection('col-1');
    });

    expect(result.current.currentRoute.type).toBe('collection');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);

    // Go back
    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentRoute).toEqual({
      type: 'explorer',
      folderId: '/folder-a',
    });
    expect(result.current.canGoForward).toBe(true);

    // Go forward
    act(() => {
      result.current.goForward();
    });

    expect(result.current.currentRoute).toEqual({
      type: 'collection',
      collectionId: 'col-1',
    });
  });

  it('clears forward history when navigating to new route', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    act(() => {
      result.current.navigateToExplorer('/a');
    });
    act(() => {
      result.current.navigateToExplorer('/b');
    });
    act(() => {
      result.current.goBack(); // Back to /a, /b in forward stack
    });

    expect(result.current.canGoForward).toBe(true);

    // Navigate to a new route - should clear forward stack
    act(() => {
      result.current.navigateToCollection('new-col');
    });

    expect(result.current.currentRoute.type).toBe('collection');
    expect(result.current.canGoForward).toBe(false);
  });
});
