import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// Simple in-memory store for ESP32 device status
let deviceStatus: { [deviceId: string]: { lastSeen: Date; isOnline: boolean } } = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  if (deviceId) {
    const status = deviceStatus[deviceId] || { lastSeen: null, isOnline: false };
    return NextResponse.json({
      deviceId,
      ...status,
      lastSeen: status.lastSeen?.toISOString() || null
    });
  }

  // Return all device statuses
  const allStatuses = Object.entries(deviceStatus).map(([id, status]) => ({
    deviceId: id,
    ...status,
    lastSeen: status.lastSeen?.toISOString() || null
  }));

  return NextResponse.json({ devices: allStatuses });
}

export async function POST(request: NextRequest) {
  try {
    const { deviceId, action } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    switch (action) {
      case 'heartbeat':
        // Update device as online with current timestamp
        deviceStatus[deviceId] = {
          lastSeen: new Date(),
          isOnline: true
        };
        console.log(`💓 Heartbeat received from ${deviceId}`);
        break;

      case 'offline':
        // Manually set device offline
        if (deviceStatus[deviceId]) {
          deviceStatus[deviceId].isOnline = false;
        } else {
          deviceStatus[deviceId] = {
            lastSeen: new Date(),
            isOnline: false
          };
        }
        console.log(`📴 Device ${deviceId} set to offline`);
        break;

      case 'online':
        // Manually set device online
        deviceStatus[deviceId] = {
          lastSeen: new Date(),
          isOnline: true
        };
        console.log(`📱 Device ${deviceId} set to online`);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deviceId,
      status: deviceStatus[deviceId]
    });

  } catch (error) {
    console.error('Error updating device status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Background cleanup - remove devices that haven't been seen for more than 1 hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  Object.keys(deviceStatus).forEach(deviceId => {
    const device = deviceStatus[deviceId];
    if (device.lastSeen < oneHourAgo) {
      device.isOnline = false;
      console.log(`⏰ Device ${deviceId} marked offline due to inactivity`);
    }
  });
}, 5 * 60 * 1000); // Check every 5 minutes