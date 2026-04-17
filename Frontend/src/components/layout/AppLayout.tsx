import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SkipLink } from '../accessibility';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSidebar = true,
  showFooter = true,
  maxWidth = '7xl',
  className,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const maxWidthClasses = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <SkipLink targetId="main-content" />

      {/* Navbar */}
      <Navbar
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 transition-all duration-300',
            showSidebar && 'lg:ml-64',
            className
          )}
        >
          <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth])}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};
