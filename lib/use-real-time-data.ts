'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Pothole } from './types';

export function useRealTimeData() {
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data
  const fetchPotholes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/potholes');
      if (!response.ok) throw new Error('Failed to fetch potholes');
      
      const data = await response.json();
      setPotholes(data.potholes || []);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

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
    isConnected 
  };
}