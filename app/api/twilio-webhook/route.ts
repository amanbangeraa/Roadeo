import { NextRequest, NextResponse } from 'next/server';
import { addPotholeRecord } from '@/lib/firebase-service';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

interface ParsedSMSData {
  deviceId: string;
  latitude: number;
  longitude: number;
  intensity: number;
  timestamp: number;
  satellites: number;
  type: 'POTHOLE' | 'HEARTBEAT';
}

function parseSMSData(messageBody: string): ParsedSMSData | null {
  try {
    // Expected format: ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076000|LNG:72.877700|INT:85.0|TIME:123456|SATS:8|TYPE:POTHOLE
    
    if (!messageBody.startsWith('ROADPULSE|')) {
      console.log('Invalid SMS format - missing ROADPULSE prefix');
      return null;
    }

    const parts = messageBody.split('|');
    const data: Partial<ParsedSMSData> = {};

    for (const part of parts) {
      if (part.includes(':')) {
        const [key, value] = part.split(':');
        
        switch (key) {
          case 'DEV':
            data.deviceId = value;
            break;
          case 'LAT':
            data.latitude = parseFloat(value);
            break;
          case 'LNG':
            data.longitude = parseFloat(value);
            break;
          case 'INT':
            data.intensity = parseFloat(value);
            break;
          case 'TIME':
            data.timestamp = parseInt(value);
            break;
          case 'SATS':
            data.satellites = parseInt(value);
            break;
          case 'TYPE':
            data.type = value as 'POTHOLE' | 'HEARTBEAT';
            break;
        }
      }
    }

    // Validate required fields
    if (!data.deviceId || !data.latitude || !data.longitude || !data.type) {
      console.log('Missing required fields in SMS data:', data);
      return null;
    }

    return data as ParsedSMSData;
  } catch (error) {
    console.error('Error parsing SMS data:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Received Twilio webhook');
    
    // Parse form data from Twilio
    const formData = await request.formData();
    const messageBody = formData.get('Body') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    
    console.log('📱 SMS Details:', {
      from,
      to,
      messageBody: messageBody?.substring(0, 100) + '...',
      fullBody: messageBody
    });
    
    // Log ALL incoming webhooks for debugging
    console.log('🔍 WEBHOOK DEBUG - Raw form data:', Object.fromEntries(formData.entries()));

    if (!messageBody) {
      console.log('❌ No message body received');
      return NextResponse.json({ error: 'No message body' }, { status: 400 });
    }

    // Parse the structured SMS data
    const parsedData = parseSMSData(messageBody);
    
    if (!parsedData) {
      console.log('❌ Failed to parse SMS data');
      return NextResponse.json({ error: 'Invalid SMS format' }, { status: 400 });
    }

    console.log('✅ Parsed SMS data:', parsedData);

    // Update ESP32 device status (heartbeat)
    try {
      const url = new URL(request.url);
      await fetch(`${url.protocol}//${url.host}/api/esp32-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: parsedData.deviceId,
          action: 'heartbeat'
        })
      });
    } catch (error) {
      console.warn('⚠️ Failed to update device status:', error);
    }

    // Handle different types of messages
    if (parsedData.type === 'POTHOLE') {
      // Store pothole data in Firebase
      const potholeData = {
        deviceId: parsedData.deviceId,
        timestamp: new Date().toISOString(), // Use server timestamp
        location: {
          latitude: parsedData.latitude,
          longitude: parsedData.longitude,
        },
        vibrationIntensity: parsedData.intensity,
        source: 'SMS',
        satellites: parsedData.satellites,
        processedAt: new Date().toISOString(),
        rawSMS: messageBody,
      };

      console.log('💾 Storing pothole data to Firebase...');
      
      try {
        await addPotholeRecord(potholeData);
        console.log('✅ Pothole data stored successfully');
        
        return NextResponse.json({ 
          status: 'success', 
          message: 'Pothole data processed and stored',
          deviceId: parsedData.deviceId,
          intensity: parsedData.intensity
        });
      } catch (firebaseError) {
        console.error('❌ Firebase error:', firebaseError);
        
        // If Firebase fails, still return success to prevent SMS retries
        // but log the issue for debugging
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Unknown error';
        
        if (errorMessage.includes('Firebase is not properly configured')) {
          console.error('🔥 Firebase configuration issue - check environment variables');
        }
        
        return NextResponse.json({ 
          status: 'warning', 
          message: 'SMS processed but storage failed - check logs',
          error: 'Database storage failed',
          details: errorMessage,
          deviceId: parsedData.deviceId,
          intensity: parsedData.intensity
        });
      }
      
    } else if (parsedData.type === 'HEARTBEAT') {
      // Store heartbeat data for device monitoring
      console.log('💓 Processing heartbeat from device:', parsedData.deviceId);
      
      const heartbeatData = {
        deviceId: parsedData.deviceId,
        timestamp: new Date().toISOString(),
        location: {
          latitude: parsedData.latitude,
          longitude: parsedData.longitude,
        },
        satellites: parsedData.satellites,
        type: 'heartbeat',
        source: 'SMS',
        processedAt: new Date().toISOString(),
      };

      // You can store heartbeats in a separate collection or update device status
      console.log('Device status update:', heartbeatData);
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Heartbeat processed',
        deviceId: parsedData.deviceId
      });
    } else {
      console.log('❌ Unknown message type:', parsedData.type);
      return NextResponse.json({ error: 'Unknown message type' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'RoadPulse Twilio Webhook is running',
    timestamp: new Date().toISOString()
  });
}