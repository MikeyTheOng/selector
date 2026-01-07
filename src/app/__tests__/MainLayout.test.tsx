import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainLayout } from '../MainLayout';

describe('MainLayout', () => {
  it('renders sidebar slot', () => {
    const sidebar = <div data-testid="test-sidebar">Test Sidebar</div>;
    render(
      <MainLayout sidebar={sidebar} header={<div>Header</div>}>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('test-sidebar')).toBeDefined();
    expect(screen.getByText('Test Sidebar')).toBeDefined();
  });

  it('renders header slot', () => {
    const header = <div data-testid="test-header">Test Header</div>;
    render(
      <MainLayout sidebar={<div>Sidebar</div>} header={header}>
        <div>Content</div>
      </MainLayout>
    );
    expect(screen.getByTestId('test-header')).toBeDefined();
    expect(screen.getByText('Test Header')).toBeDefined();
  });

  it('renders children content', () => {
    render(
      <MainLayout sidebar={<div>Sidebar</div>} header={<div>Header</div>}>
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
        header={<div data-testid="header">Header</div>}
      >
        <div data-testid="content">Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeDefined();
    expect(screen.getByTestId('header')).toBeDefined();
    expect(screen.getByTestId('content')).toBeDefined();
  });
});
