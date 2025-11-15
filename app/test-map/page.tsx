'use client';

import { useState } from 'react';
import GoogleMap from '@/components/google-map';

export default function MapTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testMarkers = [
    {
      position: { lat: 13.0827, lng: 80.2707 },
      title: 'Test Pothole - Anna Salai',
      severity: 'high' as const,
      onClick: () => addLog('Clicked: Anna Salai marker')
    },
    {
      position: { lat: 13.0878, lng: 80.2785 },
      title: 'Test Pothole - Marina Beach',
      severity: 'medium' as const,
      onClick: () => addLog('Clicked: Marina Beach marker')
    }
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Google Maps Test</h1>
      
      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Map Component</h2>
        <GoogleMap
          center={{ lat: 13.0827, lng: 80.2707 }}
          zoom={12}
          markers={testMarkers}
          className="w-full h-96 rounded-lg border"
          onMapLoad={(map) => addLog('Map loaded successfully!')}
        />
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <p key={index} className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-1 rounded">
                {log}
              </p>
            ))
          )}
        </div>
        <button 
          onClick={() => setLogs([])}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Environment Check</h2>
        <p className="text-sm">
          API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}
        </p>
        <p className="text-sm">
          Google Maps: {typeof window !== 'undefined' && window.google ? '✅ Loaded' : '⏳ Loading...'}
        </p>
      </div>
    </div>
  );
}