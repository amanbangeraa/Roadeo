'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/context';
import { useNavigation } from '@/lib/navigation-context';
import { generateMockPotholes, type Pothole } from '@/lib/mock-data';
import { useRealTimeData } from '@/lib/use-real-time-data';
import { type FilterState } from '@/lib/types';
import { MapView } from './map-view';
import { PotholeList } from './pothole-list';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AlertsPanel } from './alerts-panel';
import { ReportsPanel } from './reports-panel';
import { MapUpdateToast } from './map-update-notification';

export function DashboardContent() {
  const { user } = useAuth();
  const { currentTab } = useNavigation();
  
  // Real-time data from ESP32
  const { 
    potholes: realPotholes, 
    loading: realLoading, 
    error: realError, 
    refreshData,
    isConnected 
  } = useRealTimeData();
  
  // Mock data for demonstration (can be removed once ESP32 is producing data)
  const [mockPotholes, setMockPotholes] = useState<Pothole[]>([]);
  const [newMockPotholes, setNewMockPotholes] = useState<Pothole[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  
  const [filters, setFilters] = useState<FilterState>({
    severity: 'all',
    status: 'all',
    dateRange: 'all',
    deviceId: 'all',
    searchLocation: '',
  });

  // Initialize mock data
  useEffect(() => {
    setMockPotholes(generateMockPotholes(50));
  }, []);

  // Keep mock updates for demonstration (remove when ESP32 is fully operational)
  useEffect(() => {
    if (user?.role !== 'municipal_agent') return;

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      if (Math.random() > 0.8) { // Reduced frequency for demo
        const newPothole = generateMockPotholes(1)[0];
        newPothole.id = `PTH-MOCK-${Date.now()}`;
        
        setNewMockPotholes(prev => [newPothole, ...prev]);
        setLastUpdateTime(Date.now());
        
        setTimeout(() => {
          setNewMockPotholes(prev => prev.filter(p => p.id !== newPothole.id));
          setMockPotholes(current => [newPothole, ...current.slice(0, -1)]);
        }, 5000);
      }
    }, 120000); // Every 2 minutes

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [user?.role]);

  // Combine real and mock data
  const allPotholes = useMemo(() => {
    return [...realPotholes, ...mockPotholes, ...newMockPotholes];
  }, [realPotholes, mockPotholes, newMockPotholes]);

  // Memoized filtering to prevent unnecessary recalculations
  const filteredPotholes = useMemo(() => {
    return allPotholes.filter((p) => {
      if (filters.severity !== 'all' && p.severityLevel !== filters.severity) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.deviceId !== 'all' && p.deviceId !== filters.deviceId) return false;

      const potholeDate = new Date(p.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - potholeDate.getTime()) / (1000 * 60 * 60 * 24));

      if (filters.dateRange === 'today' && daysDiff > 0) return false;
      if (filters.dateRange === 'week' && daysDiff > 7) return false;
      if (filters.dateRange === 'month' && daysDiff > 30) return false;

      if (filters.searchLocation && !p.gps.address.toLowerCase().includes(filters.searchLocation.toLowerCase())) return false;

      // For vehicle owners, only show their device's potholes
      if (user?.role === 'vehicle_owner') {
        const userDevice = localStorage.getItem('userDevice') || 'ESP32-BUS-001';
        if (p.deviceId !== userDevice) return false;
      }

      return true;
    });
  }, [allPotholes, filters, user?.role]);

  // Memoized callback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!user?.role) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Connection Status */}
      <div className="mb-4 p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              ESP32 Connection: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Real: {realPotholes.length} | Mock: {mockPotholes.length} | Total: {allPotholes.length}
          </div>
          <button 
            onClick={refreshData}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        {realError && (
          <div className="mt-2 text-sm text-red-600">
            Error: {realError}
          </div>
        )}
      </div>

      {/* Floating notification for new updates */}
      {user?.role === 'municipal_agent' && (
        <MapUpdateToast
          newItemsCount={newMockPotholes.length}
          onViewNow={() => {
            setMockPotholes(current => [...newMockPotholes, ...current]);
            setNewMockPotholes([]);
          }}
          onDismiss={() => setNewMockPotholes([])}
        />
      )}
      
      <div className="p-6 space-y-6">
      
      {currentTab === 'dashboard' && <AnalyticsDashboard potholes={filteredPotholes} role={user.role} />}
      {currentTab === 'map' && (
        <MapView 
          potholes={filteredPotholes} 
          filters={filters} 
          onFilterChange={handleFilterChange}
          lastUpdateTime={lastUpdateTime}
        />
      )}
      {currentTab === 'list' && (
        <PotholeList 
          potholes={filteredPotholes} 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          role={user.role} 
        />
      )}
      {currentTab === 'analytics' && <AnalyticsDashboard potholes={filteredPotholes} role={user.role} />}
        {user.role === 'municipal_agent' && currentTab === 'alerts' && <AlertsPanel potholes={allPotholes} />}
        {user.role === 'municipal_agent' && currentTab === 'reports' && <ReportsPanel potholes={filteredPotholes} />}
      </div>
    </>
  );
}
