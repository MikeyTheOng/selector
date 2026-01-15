import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useExplorerSelection } from '../use-explorer-selection';
import type { ExplorerItem } from '@/types/explorer';

// Mock item helper conforming to ExplorerFileItem
const mockItem = (path: string, name: string): ExplorerItem => ({
  path,
  name,
  kind: 'file',
  extension: 'txt',
  kindLabel: 'Text File',
  size: 100,
  sizeLabel: '100 B',
  dateModified: new Date(),
  dateModifiedLabel: 'Just now',
  status: 'available',
});

describe('useExplorerSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedPaths).toEqual({});
  });

  it('selects a single item', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('/path/a', 'Item A');
    
    act(() => {
      result.current.selectItem(item);
    });
    
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedPaths['/path/a']).toBe(item);
  });

  it('toggles selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('/path/a', 'Item A');
    
    act(() => {
      result.current.toggleSelection(item);
    });
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.toggleSelection(item);
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects a range of items', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const items = [
      mockItem('/path/a', 'A'),
      mockItem('/path/b', 'B'),
      mockItem('/path/c', 'C'),
      mockItem('/path/d', 'D'),
    ];
    
    act(() => {
      result.current.selectRange(items[0], items[2], items);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.selectedPaths['/path/a']).toBeDefined();
    expect(result.current.selectedPaths['/path/b']).toBeDefined();
    expect(result.current.selectedPaths['/path/c']).toBeDefined();
    expect(result.current.selectedPaths['/path/d']).toBeUndefined();
  });

  it('clears selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    act(() => {
      result.current.selectItem(mockItem('/path/a', 'A'));
    });
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.clearSelections();
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects multiple items', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const items = [mockItem('/path/a', 'A'), mockItem('/path/b', 'B')];
    
    act(() => {
      result.current.selectMultiple(items);
    });
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.selectMultiple([mockItem('/path/c', 'C')], { additive: true });
    });
    expect(result.current.selectedCount).toBe(3);
  });

  it('removes a specific selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('/path/a', 'A');
    act(() => { result.current.selectItem(item); });
    
    act(() => {
      result.current.removeSelection('/path/a');
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('handles focus and last clicked item', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('/path/a', 'A');
    
    act(() => {
      result.current.focusItem(item);
      result.current.updateLastClickedItem(item);
    });
    
    expect(result.current.focusedPath).toBe('/path/a');
    expect(result.current.lastClickedPath).toBe('/path/a');

    act(() => {
      result.current.clearFocus();
    });
    expect(result.current.focusedPath).toBeNull();
  });
});