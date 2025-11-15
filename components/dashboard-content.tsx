'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/context';
import { useNavigation } from '@/lib/navigation-context';
import { type Pothole } from '@/lib/types';
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
  
  // Real-time data from ESP32 (Firebase backend)
  const { 
    potholes: realTimePotholes, 
    loading, 
    error, 
    refreshData,
    isConnected 
  } = useRealTimeData();
  
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [newPotholeCount, setNewPotholeCount] = useState<number>(0);
  
  const [filters, setFilters] = useState<FilterState>({
    severity: 'all',
    status: 'all',
    dateRange: 'all',
    deviceId: 'all',
    searchLocation: '',
  });

  // Track new potholes for notifications
  useEffect(() => {
    setLastUpdateTime(Date.now());
  }, [realTimePotholes.length]);

  // Monitor for new potholes and show notification
  useEffect(() => {
    const previousCount = parseInt(localStorage.getItem('lastPotholeCount') || '0');
    const currentCount = realTimePotholes.length;
    
    if (currentCount > previousCount && previousCount > 0) {
      setNewPotholeCount(currentCount - previousCount);
      // Auto-clear notification after 10 seconds
      setTimeout(() => setNewPotholeCount(0), 10000);
    }
    
    localStorage.setItem('lastPotholeCount', currentCount.toString());
  }, [realTimePotholes.length]);

  // Memoized filtering for real-time ESP32 data
  const filteredPotholes = useMemo(() => {
    return realTimePotholes.filter((p) => {
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
  }, [realTimePotholes, filters, user?.role]);

  // Memoized callback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (!user?.role) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Real-time ESP32 Connection Status */}
      <div className="mb-4 p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              🔌 ESP32 Devices: {isConnected ? 'Online & Transmitting' : 'Disconnected'}
            </span>
            {loading && <div className="text-xs text-blue-600">⟳ Syncing...</div>}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700 font-medium">
              🛣️ Live Potholes: <span className="text-blue-600">{realTimePotholes.length}</span>
            </div>
            <button 
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '⟳' : '🔄'} Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ⚠️ Connection Error: {error}
          </div>
        )}
        {realTimePotholes.length === 0 && !loading && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            📡 No pothole data received yet. Ensure ESP32 devices are connected and detecting road conditions.
          </div>
        )}
      </div>

      {/* New Pothole Notification */}
      {newPotholeCount > 0 && (
        <MapUpdateToast
          newItemsCount={newPotholeCount}
          onViewNow={() => {
            setNewPotholeCount(0);
            refreshData(); // Refresh to show latest data
          }}
          onDismiss={() => setNewPotholeCount(0)}
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
        {user.role === 'municipal_agent' && currentTab === 'alerts' && <AlertsPanel potholes={realTimePotholes} />}
        {user.role === 'municipal_agent' && currentTab === 'reports' && <ReportsPanel potholes={filteredPotholes} />}
      </div>
    </>
  );
}
