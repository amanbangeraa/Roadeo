'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type TabType = 'dashboard' | 'map' | 'list' | 'analytics' | 'alerts' | 'reports';

interface NavigationContextType {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  return (
    <NavigationContext.Provider value={{ currentTab, setCurrentTab }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}