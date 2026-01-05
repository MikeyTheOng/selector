import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useNavigation } from '../use-navigation';

describe('useNavigation', () => {
  it('initializes with null if no initialPath provided', () => {
    const { result } = renderHook(() => useNavigation(null));
    expect(result.current.selectedFolder).toBeNull();
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it('initializes with initialPath', () => {
    const { result } = renderHook(() => useNavigation('/home'));
    expect(result.current.selectedFolder).toBe('/home');
  });

  it('navigates to a new path and updates the stack', () => {
    const { result } = renderHook(() => useNavigation('/home'));
    
    act(() => {
      result.current.navigateTo('/home/docs');
    });
    
    expect(result.current.selectedFolder).toBe('/home/docs');
    expect(result.current.canGoBack).toBe(true);
  });

  it('handles back and forward navigation', () => {
    const { result } = renderHook(() => useNavigation('/home'));
    
    act(() => {
      result.current.navigateTo('/home/docs');
    });
    
    act(() => {
      result.current.navigateTo('/home/docs/work');
    });

    expect(result.current.selectedFolder).toBe('/home/docs/work');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);

    // Go back
    act(() => {
      result.current.goBack();
    });
    expect(result.current.selectedFolder).toBe('/home/docs');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(true);

    // Go forward
    act(() => {
      result.current.goForward();
    });
    expect(result.current.selectedFolder).toBe('/home/docs/work');
  });

  it('clears forward stack when navigating to a new path', () => {
    const { result } = renderHook(() => useNavigation('/home'));
    act(() => { result.current.navigateTo('/a'); });
    act(() => { result.current.navigateTo('/b'); });
    act(() => { result.current.goBack(); }); // back to /a, /b in forward stack
    
    expect(result.current.canGoForward).toBe(true);
    
    act(() => { result.current.navigateTo('/c'); }); // /c should replace /b
    expect(result.current.selectedFolder).toBe('/c');
    expect(result.current.canGoForward).toBe(false);
  });
});
