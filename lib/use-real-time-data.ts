'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Pothole } from './types';

export function useRealTimeData() {
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastDataReceived, setLastDataReceived] = useState<Date | null>(null);

  // Check ESP32 connection status based on device status API and recent data
  const checkESP32Connection = useCallback(async (potholes: Pothole[]) => {
    console.log('🔍 Checking ESP32 connection status...');
    
    try {
      // Check device status from our ESP32 status API
      const statusResponse = await fetch('/api/esp32-status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 Device Status API Response:', statusData);
        
        // Look for devices with status 'online' (not isOnline property)
        const onlineDevices = statusData.devices?.filter((d: any) => d.status === 'online') || [];
        
        if (onlineDevices.length > 0) {
          console.log('✅ Found online devices via status API:', onlineDevices);
          setIsConnected(true);
          const mostRecentDevice = onlineDevices
            .sort((a: any, b: any) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];
          setLastDataReceived(new Date(mostRecentDevice.lastSeen));
          return;
        }
        
        // If we have devices but they're all offline, trust the status API completely
        if (statusData.devices?.length > 0) {
          console.log('❌ All devices in status API are offline, marking as disconnected');
          setIsConnected(false);
          return;
        }
        
        console.log('⚠️ No devices found in status API, checking fallback...');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch device status, falling back to pothole data check:', error);
    }

    // Fallback: Check based on recent pothole data  
    console.log('📋 Fallback: Checking connection based on recent pothole data');
    console.log('📊 Available potholes:', potholes.length);
    
    if (potholes.length === 0) {
      console.log('❌ No potholes found, marking as disconnected');
      setIsConnected(false);
      return;
    }

    // Find the most recent pothole from any ESP32 device
    const mostRecent = potholes
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (mostRecent) {
      const lastDataTime = new Date(mostRecent.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - lastDataTime.getTime();
      const minutesAgo = Math.round(timeDiff / (1000 * 60));
      
      // Consider ESP32 connected if we received data within the last 10 minutes
      // BUT BE MORE STRICT - only if it's not just test data
      const isRecentlyActive = timeDiff < 10 * 60 * 1000; // 10 minutes
      
      // Additional check: if the last data is from a test (very recent with exact test coordinates)
      const isTestData = (
        mostRecent.gps.latitude === 19.076543 && 
        mostRecent.gps.longitude === 72.877789 &&
        timeDiff < 2 * 60 * 1000 // Within last 2 minutes
      );
      
      const actuallyConnected = isRecentlyActive && !isTestData;
      
      setIsConnected(actuallyConnected);
      setLastDataReceived(lastDataTime);
      
      console.log(`📊 ESP32 Connection Status (from potholes):`, {
        lastData: lastDataTime.toISOString(),
        minutesAgo,
        isRecentlyActive,
        isTestData,
        actuallyConnected,
        coordinates: `${mostRecent.gps.latitude}, ${mostRecent.gps.longitude}`
      });
    } else {
      console.log('❌ No recent pothole found, marking as disconnected');
      setIsConnected(false);
    }
  }, []);

  // Fetch initial data
  const fetchPotholes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/potholes');
      if (!response.ok) throw new Error('Failed to fetch potholes');
      
      const data = await response.json();
      const fetchedPotholes = data.potholes || [];
      setPotholes(fetchedPotholes);
      setError(null);
      
      // Check ESP32 connection based on recent data
      checkESP32Connection(fetchedPotholes);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [checkESP32Connection]);

  // Initial fetch
  useEffect(() => {
    fetchPotholes();
  }, [fetchPotholes]);

  // Set up polling for new data (since we don't have WebSocket setup yet)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPotholes();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchPotholes]);

  const refreshData = useCallback(() => {
    fetchPotholes();
  }, [fetchPotholes]);

  return { 
    potholes, 
    loading, 
    error, 
    refreshData, 
    isConnected,
    lastDataReceived
  };
}