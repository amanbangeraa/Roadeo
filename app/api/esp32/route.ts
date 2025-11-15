import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface ESP32Data {
  deviceId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vibrationIntensity: number;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  sensorData?: {
    mpuIntensity: number;
    sw420Intensity: number;
  };
  batteryLevel?: number;
}

// POST endpoint specifically for ESP32 devices (bypasses Vercel auth)
export async function POST(request: NextRequest) {
  try {
    const data: ESP32Data = await request.json();
    
    console.log('Received ESP32 data:', data);
    
    // Validate ESP32 data
    if (!data.deviceId || data.vibrationIntensity === undefined || !data.location) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Validate it's actually an ESP32 device
    if (!data.deviceId.startsWith('ESP32')) {
      return NextResponse.json({ error: 'Unauthorized device' }, { status: 403 });
    }

    // Process and store the data
    const processedPothole = processESP32Data(data);
    
    // Store in Firebase Firestore
    const docRef = await addDoc(collection(db, 'potholes'), {
      ...processedPothole,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('ESP32 pothole data stored:', docRef.id);
    
    return NextResponse.json({ 
      success: true, 
      potholeId: docRef.id,
      message: 'ESP32 data received and processed successfully'
    });
  } catch (error) {
    console.error('Error processing ESP32 data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Simple GET endpoint for ESP32 connection testing
export async function GET() {
  return NextResponse.json({ 
    status: 'online',
    message: 'ESP32 API endpoint is working',
    timestamp: new Date().toISOString()
  });
}

function processESP32Data(data: ESP32Data) {
  const severity = calculateSeverity(data.vibrationIntensity);
  
  return {
    deviceId: data.deviceId,
    location: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    },
    gps: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: `Lat: ${data.location.latitude.toFixed(6)}, Lng: ${data.location.longitude.toFixed(6)}`,
    },
    vibrationIntensity: data.vibrationIntensity,
    severityLevel: severity,
    vehicleInfo: {
      type: 'Bus',
      owner: 'Public Transport',
      registrationNumber: data.deviceId,
    },
    status: 'reported' as const,
    assignedTo: null,
    priority: severity === 'high' ? 'Critical' : severity === 'medium' ? 'High' : 'Medium',
    notes: [],
    repairedAt: null,
    repairedBy: null,
    sensorData: {
      accelerometer: data.accelerometer,
      vibration: data.vibrationIntensity,
      sensorData: data.sensorData,
      batteryLevel: data.batteryLevel,
    },
    deviceInfo: {
      model: 'ESP32-DevKit',
      firmware: '1.0.0',
      signalStrength: -45,
      originalTimestamp: data.timestamp,
    },
  };
}

function calculateSeverity(vibrationIntensity: number): 'low' | 'medium' | 'high' {
  if (vibrationIntensity > 85) return 'high';
  if (vibrationIntensity > 65) return 'medium';
  return 'low';
}