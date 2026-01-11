import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileExplorerPage } from '../FileExplorerPage';

// Mock the child components to verify they are rendered
vi.mock('../FileExplorerView', () => ({
  FileExplorerView: () => <div data-testid="file-explorer-view" />,
}));

// Mock the provider to verify it wraps the children
vi.mock('../../context/ExplorerContext', () => ({
  ExplorerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="explorer-provider">{children}</div>
  ),
}));

describe('FileExplorerPage', () => {
  const defaultProps = {
    locations: [],
    folderId: '/test',
    onSelectFolder: vi.fn(),
    SelectionPanel: () => <div data-testid="selection-panel" />,
  };

  it('renders ExplorerProvider wrapping FileExplorerView', () => {
    render(<FileExplorerPage {...defaultProps} />);
    
    const provider = screen.getByTestId('explorer-provider');
    const view = screen.getByTestId('file-explorer-view');
    
    expect(provider).toBeDefined();
    expect(view).toBeDefined();
    expect(provider).toContainElement(view);
  });
});
