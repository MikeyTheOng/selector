import type { ReactNode } from "react";

interface MainLayoutProps {
  /** Sidebar content (e.g., LocationsSidebar + Collections) */
  sidebar: ReactNode;
  /** Main view content */
  children: ReactNode;
}

export function MainLayout({ sidebar, children }: MainLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Content */}
        {children}
      </section>
    </div>
  );
}
