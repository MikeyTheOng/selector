import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useExplorerSelection } from '../use-explorer-selection';
import type { ExplorerItem } from '@/types/explorer';

const mockItem = (id: string, name: string): ExplorerItem => ({
  id,
  path: `/path/${id}`,
  name,
  kind: 'file',
  status: 'available',
});

describe('useExplorerSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedItems).toEqual({});
  });

  it('selects a single item', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('a', 'Item A');
    
    act(() => {
      result.current.selectItem(item);
    });
    
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedItems['a']).toBe(item);
  });

  it('toggles selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('a', 'Item A');
    
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
      mockItem('a', 'A'),
      mockItem('b', 'B'),
      mockItem('c', 'C'),
      mockItem('d', 'D'),
    ];
    
    act(() => {
      result.current.selectRange(items[0], items[2], items);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.selectedItems['a']).toBeDefined();
    expect(result.current.selectedItems['b']).toBeDefined();
    expect(result.current.selectedItems['c']).toBeDefined();
    expect(result.current.selectedItems['d']).toBeUndefined();
  });

  it('clears selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    act(() => {
      result.current.selectItem(mockItem('a', 'A'));
    });
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.clearSelections();
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects multiple items', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const items = [mockItem('a', 'A'), mockItem('b', 'B')];
    
    act(() => {
      result.current.selectMultiple(items);
    });
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.selectMultiple([mockItem('c', 'C')], { additive: true });
    });
    expect(result.current.selectedCount).toBe(3);
  });

  it('removes a specific selection', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('a', 'A');
    act(() => { result.current.selectItem(item); });
    
    act(() => {
      result.current.removeSelection('a');
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('handles focus and last clicked item', () => {
    const { result } = renderHook(() => useExplorerSelection());
    const item = mockItem('a', 'A');
    
    act(() => {
      result.current.focusItem(item, '/column');
    });
    
    expect(result.current.focusedItem?.item).toBe(item);
    expect(result.current.focusedItem?.context).toBe('/column');
    expect(result.current.lastClickedItem?.item).toBe(item);

    act(() => {
      result.current.clearFocus();
    });
    expect(result.current.focusedItem).toBeNull();
  });
});
