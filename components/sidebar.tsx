'use client';

import { useAuth } from '@/lib/context';
import { useNavigation } from '@/lib/navigation-context';
import { Activity, Map, List, BarChart3, AlertCircle, FileText, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { currentTab, setCurrentTab } = useNavigation();

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, visible: true },
    { id: 'map', label: 'Map View', icon: Map, visible: true },
    { id: 'list', label: 'Pothole List', icon: List, visible: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, visible: true },
  ];

  const agentMenuItems = [
    { id: 'alerts', label: 'Alerts', icon: AlertCircle, visible: user?.role === 'municipal_agent' },
    { id: 'reports', label: 'Reports', icon: FileText, visible: user?.role === 'municipal_agent' },
  ];

  const allMenuItems = [...baseMenuItems, ...agentMenuItems];
  const visibleItems = allMenuItems.filter((item) => item.visible);

  const handleMenuClick = (id: string) => {
    setCurrentTab(id as any);
    onClose?.();
  };

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg text-foreground">RoadPulse</h1>
            <p className="text-xs text-muted-foreground">Road Monitoring</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
        <p className="font-medium text-foreground text-sm truncate">{user?.email}</p>
        <p className="text-xs text-primary capitalize mt-1">
          {user?.role.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
