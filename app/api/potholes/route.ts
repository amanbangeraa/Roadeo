import { NextRequest, NextResponse } from 'next/server';
import { potholeService, addPotholeRecord } from '@/lib/firebase-service';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export interface ESP32Data {
  deviceId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vibrationIntensity: number;
  accelerometer?: {
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

// POST endpoint to receive data from ESP32 (backup method - primary is SMS via Twilio)
export async function POST(request: NextRequest) {
  try {
    const data: ESP32Data = await request.json();
    
    console.log('📥 Received ESP32 data via HTTP:', data);
    
    // Validate ESP32 data
    if (!data.deviceId || data.vibrationIntensity === undefined || !data.location) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Prepare data for Firebase storage
    const potholeData = {
      deviceId: data.deviceId,
      timestamp: new Date().toISOString(),
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude
      },
      vibrationIntensity: data.vibrationIntensity,
      source: 'HTTP',
      accelerometer: data.accelerometer,
      sensorData: data.sensorData,
      batteryLevel: data.batteryLevel,
      processedAt: new Date().toISOString()
    };

    // Store in Firebase using our existing service
    const potholeId = await addPotholeRecord(potholeData);
    
    console.log('✅ ESP32 pothole stored in Firebase:', potholeId);
    
    return NextResponse.json({ 
      success: true, 
      potholeId,
      message: 'Pothole data received and stored in Firebase'
    });
  } catch (error) {
    console.error('❌ Error processing ESP32 data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve potholes from Firebase
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Fetching potholes from Firebase...');
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const deviceId = searchParams.get('deviceId') || undefined;
    const severityLevel = searchParams.get('severity') as 'low' | 'medium' | 'high' | undefined;
    const status = searchParams.get('status') || undefined;

    // Build filter object
    const filters: any = { limit };
    if (deviceId && deviceId !== 'all') filters.deviceId = deviceId;
    if (severityLevel) filters.severityLevel = severityLevel;
    if (status && status !== 'all') filters.status = status;

    // Fetch potholes from Firebase
    const potholes = await potholeService.getPotholes(filters);

    console.log(`✅ Retrieved ${potholes.length} potholes from Firebase`);

    // Convert Firebase data to expected frontend format
    const formattedPotholes = potholes.map(pothole => ({
      id: pothole.id,
      deviceId: pothole.deviceId,
      timestamp: pothole.timestamp instanceof Date ? pothole.timestamp.toISOString() : 
                 (pothole.timestamp as any)?.toDate?.() ? 
                 (pothole.timestamp as any).toDate().toISOString() : pothole.timestamp,
      gps: {
        latitude: pothole.location.latitude,
        longitude: pothole.location.longitude,
        address: `Lat: ${pothole.location.latitude.toFixed(6)}, Lng: ${pothole.location.longitude.toFixed(6)}`
      },
      vibrationIntensity: pothole.vibrationIntensity,
      severityLevel: pothole.severityLevel,
      status: pothole.status,
      vehicleInfo: {
        type: 'ESP32 Device',
        owner: 'Municipal Transport',
        registrationNumber: pothole.deviceId
      },
      assignedTo: null,
      priority: pothole.severityLevel,
      notes: [],
      createdAt: pothole.createdAt instanceof Date ? pothole.createdAt.toISOString() : 
                 (pothole.createdAt as any)?.toDate?.() ? 
                 (pothole.createdAt as any).toDate().toISOString() : pothole.createdAt,
      updatedAt: pothole.updatedAt instanceof Date ? pothole.updatedAt.toISOString() : 
                 (pothole.updatedAt as any)?.toDate?.() ? 
                 (pothole.updatedAt as any).toDate().toISOString() : pothole.updatedAt,
      repairedAt: null,
      repairedBy: null
    }));

    return NextResponse.json({ 
      potholes: formattedPotholes,
      count: formattedPotholes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching potholes from Firebase:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      potholes: [],
      count: 0
    }, { status: 500 });
  }
}

// Note: This endpoint serves as a backup to the SMS/Twilio webhook method
// Primary data flow: ESP32 → SMS → Twilio → /api/twilio-webhook → Firebase
// Secondary data flow: ESP32 → HTTP → /api/potholes → Firebase