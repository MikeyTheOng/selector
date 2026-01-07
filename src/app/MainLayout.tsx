import type { ReactNode } from "react";

interface MainLayoutProps {
  /** Sidebar content (e.g., LocationsSidebar + Collections) */
  sidebar: ReactNode;
  /** Header content (e.g., ExplorerToolbar or CollectionToolbar) */
  header: ReactNode;
  /** Main view content */
  children: ReactNode;
}

export function MainLayout({ sidebar, header, children }: MainLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header */}
        {header}

        {/* Content */}
        {children}
      </section>
    </div>
  );
}
