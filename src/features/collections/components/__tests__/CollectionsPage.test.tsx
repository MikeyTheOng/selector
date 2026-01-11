import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CollectionsPage } from '../CollectionsPage';

// Mock the child components to verify they are rendered
vi.mock('../CollectionToolbar', () => ({
  CollectionToolbar: ({ collectionId }: { collectionId: string }) => (
    <div data-testid="collection-toolbar">Toolbar {collectionId}</div>
  ),
}));

vi.mock('../CollectionsView', () => ({
  CollectionsView: ({ collectionId }: { collectionId: string }) => (
    <div data-testid="collections-view">View {collectionId}</div>
  ),
}));

describe('CollectionsPage', () => {
  it('renders CollectionToolbar and CollectionsView', () => {
    render(<CollectionsPage collectionId="123" />);
    
    expect(screen.getByTestId('collection-toolbar')).toHaveTextContent('Toolbar 123');
    expect(screen.getByTestId('collections-view')).toHaveTextContent('View 123');
  });
});
