'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  markerCount: number;
}

export function useMapPerformance(markerCount: number) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    markerCount: 0
  });
  
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);

  // Start performance measurement
  const startMeasure = () => {
    startTime.current = performance.now();
  };

  // End performance measurement
  const endMeasure = () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    renderTimes.current.push(renderTime);
    
    // Keep only the last 10 measurements
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }
    
    const averageTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
    
    setMetrics({
      renderCount: metrics.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: averageTime,
      markerCount
    });
  };

  return { metrics, startMeasure, endMeasure };
}

// Performance debug component (only shows in development)
export function MapPerformanceDebug({ metrics }: { metrics: PerformanceMetrics }) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Renders: {metrics.renderCount}</div>
      <div>Last: {metrics.lastRenderTime.toFixed(1)}ms</div>
      <div>Avg: {metrics.averageRenderTime.toFixed(1)}ms</div>
      <div>Markers: {metrics.markerCount}</div>
    </div>
  );
}