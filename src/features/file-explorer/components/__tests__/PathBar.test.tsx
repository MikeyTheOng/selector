import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PathBar } from '../PathBar';
import type { LocationItem } from '@/types/explorer';

describe('PathBar', () => {
  const mockLocations: LocationItem[] = [
    { path: '/Users/test', name: 'Home', kind: 'favorite' },
    { path: '/Volumes/Macintosh HD', name: 'Macintosh HD', kind: 'volume' },
    { path: '/Volumes/External', name: 'External', kind: 'volume' },
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
        selectedFolder="/Users/test/documents/work" 
        locations={mockLocations} 
        onSelectFolder={vi.fn()} 
      />
    );
    
    expect(screen.getByText('Macintosh HD')).toBeDefined();
    expect(screen.getByText('documents')).toBeDefined();
    expect(screen.getByText('work')).toBeDefined();
  });

  it('calls onSelectFolder when segment clicked', () => {
    const onSelectFolder = vi.fn();
    render(
      <PathBar 
        selectedFolder="/Users/test/documents/work" 
        locations={mockLocations} 
        onSelectFolder={onSelectFolder} 
      />
    );
    
    fireEvent.click(screen.getByText('documents').closest('button')!);
    expect(onSelectFolder).toHaveBeenCalledWith('/Users/test/documents');
  });

  it('uses volume root for external paths', () => {
    render(
      <PathBar
        selectedFolder="/Volumes/External/projects/demo"
        locations={mockLocations}
        onSelectFolder={vi.fn()}
      />
    );

    expect(screen.getByText('External')).toBeDefined();
    expect(screen.getByText('projects')).toBeDefined();
  });
});
