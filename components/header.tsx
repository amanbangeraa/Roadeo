'use client';

import { useAuth } from '@/lib/context';
import { useTheme } from '@/lib/theme-context';
import { Bell, Search, User, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function Header() {
  const { user: _user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications] = useState(3);

  return (
    <div className="flex-1 flex items-center justify-between gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-sm hidden sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-10 bg-input border-border/50 text-sm"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full text-xs font-bold flex items-center justify-center text-foreground">
              {notifications}
            </span>
          )}
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* User Profile */}
        <Button variant="ghost" size="icon" className="flex items-center gap-2">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
