import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PathBar } from '../PathBar';
import type { LocationItem } from '@/types/explorer';

describe('PathBar', () => {
  const mockLocations: LocationItem[] = [
    { path: '/users/test', name: 'Home', kind: 'home' },
  ];

  it('renders nothing when no folder selected', () => {
    const { container } = render(
      <PathBar selectedFolder={null} locations={mockLocations} onSelectFolder={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumbs for selected folder', () => {
    render(
      <PathBar 
        selectedFolder="/users/test/documents/work" 
        locations={mockLocations} 
        onSelectFolder={vi.fn()} 
      />
    );
    
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('documents')).toBeDefined();
    expect(screen.getByText('work')).toBeDefined();
  });

  it('calls onSelectFolder when segment clicked', () => {
    const onSelectFolder = vi.fn();
    render(
      <PathBar 
        selectedFolder="/users/test/documents/work" 
        locations={mockLocations} 
        onSelectFolder={onSelectFolder} 
      />
    );
    
    fireEvent.click(screen.getByText('documents').closest('button')!);
    expect(onSelectFolder).toHaveBeenCalledWith('/users/test/documents');
  });
});
