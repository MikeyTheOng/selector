import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainLayout } from '../MainLayout';

describe('MainLayout', () => {
  it('renders sidebar slot', () => {
    const sidebar = <div data-testid="test-sidebar">Test Sidebar</div>;
    render(
      <MainLayout sidebar={sidebar}>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('test-sidebar')).toBeDefined();
    expect(screen.getByText('Test Sidebar')).toBeDefined();
  });

  it('renders children content', () => {
    render(
      <MainLayout sidebar={<div>Sidebar</div>}>
        <div data-testid="main-content">Main Content Area</div>
      </MainLayout>
    );
    expect(screen.getByTestId('main-content')).toBeDefined();
    expect(screen.getByText('Main Content Area')).toBeDefined();
  });

  it('renders all sections together', () => {
    render(
      <MainLayout
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        <div data-testid="content">Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeDefined();
    expect(screen.getByTestId('content')).toBeDefined();
  });
});