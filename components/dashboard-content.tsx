'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/context';
import { useNavigation } from '@/lib/navigation-context';
import { useRealTimeData } from '@/lib/use-real-time-data';
import { type FilterState, type Pothole } from '@/lib/types';
import { MapView } from './map-view';
import { PotholeList } from './pothole-list';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AlertsPanel } from './alerts-panel';
import { ReportsPanel } from './reports-panel';
import { MapUpdateToast } from './map-update-notification';

export function DashboardContent() {
  const { user } = useAuth();
  const { currentTab } = useNavigation();
  
  // Real-time data from ESP32 via SMS/Twilio webhook
  const { 
    potholes: realPotholes, 
    loading: realLoading, 
    error: realError, 
    refreshData,
    isConnected,
    lastDataReceived
  } = useRealTimeData();
  
  const [filters, setFilters] = useState<FilterState>({
    severity: 'all',
    status: 'all',
    dateRange: 'all',
    deviceId: 'all',
    searchLocation: '',
  });

  // Use only real ESP32 data - no mock data
  const allPotholes = useMemo(() => {
    return realPotholes;
  }, [realPotholes]);

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
      {/* ESP32 Connection Status */}
      <div className="mb-4 p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div>
              <span className="text-sm font-medium">
                ESP32 Status: {isConnected ? 'Online' : 'Offline'}
              </span>
              {lastDataReceived && (
                <div className="text-xs text-gray-500">
                  Last data: {new Date(lastDataReceived).toLocaleString()}
                </div>
              )}
              {!isConnected && realPotholes.length > 0 && (
                <div className="text-xs text-orange-600">
                  No data received in last 10 minutes
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            ESP32 Potholes: {realPotholes.length} | Total: {allPotholes.length}
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

      {/* Real-time updates from ESP32 via SMS */}
      {user?.role === 'municipal_agent' && realLoading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Loading ESP32 data...</span>
          </div>
        </div>
      )}
      
      <div className="p-6 space-y-6">
      
      {currentTab === 'dashboard' && <AnalyticsDashboard potholes={filteredPotholes} role={user.role} />}
      {currentTab === 'map' && (
        <MapView 
          potholes={filteredPotholes} 
          filters={filters} 
          onFilterChange={handleFilterChange}
          lastUpdateTime={Date.now()}
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
