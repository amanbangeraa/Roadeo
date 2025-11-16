export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">RoadPulse Test Page</h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, the basic Next.js setup is working.
        </p>
        <div className="space-y-2">
          <p><strong>Environment Check:</strong></p>
          <p>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
          <p>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
          <p>Google Maps API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  );
}