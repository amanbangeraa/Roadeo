'use client';

import { validateEnvironment } from '@/lib/env-validation';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envReport, setEnvReport] = useState<any>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<string>('checking...');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const report = validateEnvironment();
    setEnvReport(report);

    // Test Firebase initialization
    try {
      import('@/lib/firebase-config').then(({ db }) => {
        if (db) {
          setFirebaseStatus('✅ Firebase initialized successfully');
        } else {
          setFirebaseStatus('❌ Firebase not initialized - check environment variables');
        }
      });
    } catch (error) {
      setFirebaseStatus(`❌ Firebase error: ${error}`);
    }
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading debug information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">RoadPulse Debug Dashboard</h1>
        
        {/* Environment Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          
          {envReport && (
            <div className="space-y-4">
              <div className={`p-4 rounded ${envReport.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-semibold">
                  {envReport.isValid ? '✅ Environment Valid' : '❌ Environment Issues Detected'}
                </p>
                <p className="text-sm mt-1">
                  {envReport.present}/{envReport.total} environment variables configured
                </p>
              </div>

              {envReport.missing.length > 0 && (
                <div className="bg-yellow-100 p-4 rounded">
                  <h3 className="font-semibold text-yellow-800">Missing Required Variables:</h3>
                  <ul className="mt-2 text-sm">
                    {envReport.missing.map((variable: string) => (
                      <li key={variable} className="text-red-600">• {variable}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded ${envReport.details.firebase.configured ? 'bg-green-100' : 'bg-red-100'}`}>
                  <h3 className="font-semibold">🔥 Firebase</h3>
                  <p className="text-sm">{envReport.details.firebase.configured ? 'Configured' : 'Not Configured'}</p>
                </div>
                
                <div className={`p-4 rounded ${envReport.details.twilio.configured ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <h3 className="font-semibold">📱 Twilio SMS</h3>
                  <p className="text-sm">{envReport.details.twilio.configured ? 'Configured' : 'Optional - Not Set'}</p>
                </div>
                
                <div className={`p-4 rounded ${envReport.details.maps.configured ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <h3 className="font-semibold">🗺️ Google Maps</h3>
                  <p className="text-sm">{envReport.details.maps.configured ? 'Configured' : 'Optional - Not Set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Firebase Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Initialization</h2>
          <p className="font-mono text-sm">{firebaseStatus}</p>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="space-y-2 text-sm font-mono">
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Vercel:</strong> {process.env.VERCEL ? 'Yes' : 'No'}</p>
            <p><strong>Window Available:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Deployment Instructions</h2>
          <div className="text-sm space-y-2">
            <p>1. Ensure all required environment variables are set in Vercel:</p>
            <ul className="ml-4 space-y-1">
              <li>• NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>• NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>• NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>• NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
              <li>• NEXT_PUBLIC_FIREBASE_APP_ID</li>
            </ul>
            <p>2. Redeploy your application after setting environment variables</p>
            <p>3. Check browser console for additional error details</p>
          </div>
        </div>
      </div>
    </div>
  );
}