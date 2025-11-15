import { NextRequest, NextResponse } from 'next/server';

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

// Store potholes in memory (in production, use a database)
let storedPotholes: any[] = [];

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
    
    // Store in memory (replace with database in production)
    storedPotholes.unshift(processedPothole);
    
    // Keep only last 100 potholes to prevent memory issues
    if (storedPotholes.length > 100) {
      storedPotholes = storedPotholes.slice(0, 100);
    }
    
    console.log('Processed pothole:', processedPothole);
    
    return NextResponse.json({ 
      success: true, 
      potholeId: processedPothole.id,
      message: 'Pothole data received and processed'
    });
  } catch (error) {
    console.error('Error processing ESP32 data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to retrieve potholes
export async function GET() {
  try {
    return NextResponse.json({ 
      potholes: storedPotholes,
      count: storedPotholes.length 
    });
  } catch (error) {
    console.error('Error fetching potholes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function processESP32Data(data: ESP32Data) {
  const severity = calculateSeverity(data.vibrationIntensity);
  
  return {
    id: `ESP32-${data.deviceId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    gps: {
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: `Lat: ${data.location.latitude.toFixed(6)}, Lng: ${data.location.longitude.toFixed(6)}`,
    },
    vibrationIntensity: data.vibrationIntensity,
    severityLevel: severity,
    deviceId: data.deviceId,
    vehicleInfo: {
      type: 'Bus',
      owner: 'Public Transport',
      registrationNumber: data.deviceId,
    },
    status: 'reported' as const,
    assignedTo: null,
    priority: severity === 'high' ? 'Critical' : severity === 'medium' ? 'High' : 'Medium',
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    repairedAt: null,
    repairedBy: null,
    rawSensorData: {
      accelerometer: data.accelerometer,
      sensorData: data.sensorData,
      batteryLevel: data.batteryLevel,
      originalTimestamp: data.timestamp,
    },
  };
}

function calculateSeverity(vibrationIntensity: number): 'low' | 'medium' | 'high' {
  if (vibrationIntensity > 85) return 'high';
  if (vibrationIntensity > 65) return 'medium';
  return 'low';
}