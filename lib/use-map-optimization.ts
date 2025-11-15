'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  severity: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

export function useMapOptimization(markers: MapMarker[]) {
  const lastMarkersHash = useRef<string>('');
  
  // Create a stable markers array that only changes when content actually changes
  const optimizedMarkers = useMemo(() => {
    // Create a hash of the markers to compare
    const markersHash = JSON.stringify(
      markers.map(m => ({
        lat: Math.round(m.position.lat * 10000), // Round to avoid floating point issues
        lng: Math.round(m.position.lng * 10000),
        title: m.title,
        severity: m.severity
      }))
    );
    
    // Only return new array if hash has changed
    if (markersHash === lastMarkersHash.current) {
      return markers; // Return the same reference to prevent re-renders
    }
    
    lastMarkersHash.current = markersHash;
    return markers;
  }, [markers]);

  // Stable map center calculation
  const mapCenter = useMemo(() => {
    if (markers.length === 0) {
      return { lat: 13.0827, lng: 80.2707 }; // Default to Chennai
    }
    
    const avgLat = markers.reduce((sum, p) => sum + p.position.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, p) => sum + p.position.lng, 0) / markers.length;
    
    return { 
      lat: Math.round(avgLat * 10000) / 10000, // Round to avoid unnecessary updates
      lng: Math.round(avgLng * 10000) / 10000 
    };
  }, [markers]);

  // Stable clustering calculation
  const clusters = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    markers.forEach((marker) => {
      // Use rounded coordinates for clustering to group nearby markers
      const clusterKey = `${Math.round(marker.position.lat * 1000)},${Math.round(marker.position.lng * 1000)}`;
      if (!grouped[clusterKey]) grouped[clusterKey] = [];
      grouped[clusterKey].push(marker);
    });
    return grouped;
  }, [markers]);

  return {
    optimizedMarkers,
    mapCenter,
    clusters
  };
}

// Debounce hook for filter changes
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

