import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFileSelection } from '../use-file-selection';
import type { FileRow } from '@/types/explorer';

const mockFile = (path: string, name: string): FileRow => ({
  path,
  name,
  extension: '',
  kindLabel: 'File',
  sizeLabel: '',
  dateModified: null,
  dateModifiedLabel: '',
});

describe('useFileSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useFileSelection());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedFiles).toEqual({});
  });

  it('selects a single file', () => {
    const { result } = renderHook(() => useFileSelection());
    const file = mockFile('/a', 'a');
    
    act(() => {
      result.current.selectFile(file);
    });
    
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedFiles['/a']).toBe(file);
  });

  it('toggles selection', () => {
    const { result } = renderHook(() => useFileSelection());
    const file = mockFile('/a', 'a');
    
    act(() => {
      result.current.toggleFileSelection(file);
    });
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.toggleFileSelection(file);
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects a range of files', () => {
    const { result } = renderHook(() => useFileSelection());
    const files = [
      mockFile('/a', 'a'),
      mockFile('/b', 'b'),
      mockFile('/c', 'c'),
      mockFile('/d', 'd'),
    ];
    
    act(() => {
      result.current.selectRange(files[0], files[2], files);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.selectedFiles['/a']).toBeDefined();
    expect(result.current.selectedFiles['/b']).toBeDefined();
    expect(result.current.selectedFiles['/c']).toBeDefined();
    expect(result.current.selectedFiles['/d']).toBeUndefined();
  });

  it('clears selection', () => {
    const { result } = renderHook(() => useFileSelection());
    act(() => {
      result.current.selectFile(mockFile('/a', 'a'));
    });
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.clearSelections();
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('selects multiple files', () => {
    const { result } = renderHook(() => useFileSelection());
    const files = [mockFile('/a', 'a'), mockFile('/b', 'b')];
    
    act(() => {
      result.current.selectMultiple(files);
    });
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.selectMultiple([mockFile('/c', 'c')], { additive: true });
    });
    expect(result.current.selectedCount).toBe(3);
  });

  it('removes a specific selection', () => {
    const { result } = renderHook(() => useFileSelection());
    const file = mockFile('/a', 'a');
    act(() => { result.current.selectFile(file); });
    
    act(() => {
      result.current.removeSelection('/a');
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it('handles focus and last clicked file', () => {
    const { result } = renderHook(() => useFileSelection());
    const file = mockFile('/a', 'a');
    
    act(() => {
      result.current.focusFile(file, '/column');
    });
    
    expect(result.current.focusedFile?.file).toBe(file);
    expect(result.current.focusedFile?.columnPath).toBe('/column');
    expect(result.current.lastClickedFile?.file).toBe(file);

    act(() => {
      result.current.clearFocus();
    });
    expect(result.current.focusedFile).toBeNull();
  });
});
