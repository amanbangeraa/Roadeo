import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
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

// POST endpoint to receive data from ESP32
export async function POST(request: NextRequest) {
  try {
    const data: ESP32Data = await request.json();
    
    console.log('Received ESP32 data:', data);
    
    // Validate ESP32 data
    if (!data.deviceId || data.vibrationIntensity === undefined || !data.location) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
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
    
    console.log('Processed pothole stored in Firebase:', docRef.id);
    
    return NextResponse.json({ 
      success: true, 
      potholeId: docRef.id,
      message: 'Pothole data received and processed'
    });
  } catch (error) {
    console.error('Error processing ESP32 data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint to retrieve potholes
export async function GET() {
  try {
    // Query Firebase Firestore for potholes (latest 100, ordered by creation time)
    const q = query(
      collection(db, 'potholes'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const potholes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings for JSON serialization
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));
    
    return NextResponse.json({ 
      potholes,
      count: potholes.length 
    });
  } catch (error) {
    console.error('Error fetching potholes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
      ...(data.sensorData && { sensorData: data.sensorData }),
      ...(data.batteryLevel !== undefined && { batteryLevel: data.batteryLevel }),
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