'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context';
import { NavigationProvider } from '@/lib/navigation-context';
import { LoginPage } from './login-page';
import { DashboardContent } from './dashboard-content';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with false to prevent hydration mismatch
  const [isMobile, setIsMobile] = useState(true); // Start with true to be safe
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex items-center justify-center w-full">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <NavigationProvider>
      <div className="flex h-screen bg-background">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:relative z-50 h-screen transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar onClose={() => isMobile && setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between h-16 border-b border-border bg-card px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Header />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <DashboardContent />
          </div>
        </div>
      </div>
    </NavigationProvider>
  );
}
