import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// Test endpoint to simulate ESP32 data
export async function POST(request: NextRequest) {
  try {
    const testData = {
      deviceId: "ESP32-BUS-TEST",
      timestamp: String(Date.now()),
      location: {
        latitude: 19.0760 + (Math.random() - 0.5) * 0.01, // Mumbai with small random offset
        longitude: 72.8777 + (Math.random() - 0.5) * 0.01
      },
      vibrationIntensity: 75 + Math.random() * 20, // Random intensity between 75-95
      accelerometer: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: 1 + (Math.random() - 0.5) * 0.5
      },
      sensorData: {
        mpuIntensity: Math.floor(Math.random() * 100),
        sw420Intensity: Math.floor(Math.random() * 100)
      },
      batteryLevel: 80 + Math.random() * 20
    };

    // Send to the potholes endpoint
    const response = await fetch(new URL('/api/potholes', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Test data sent successfully',
      testData,
      result
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: 'Failed to send test data' }, { status: 500 });
  }
}