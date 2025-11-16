import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'reset_esp32_status':
        // Reset all ESP32 device status to offline
        const resetResponse = await fetch(`${new URL(request.url).protocol}//${new URL(request.url).host}/api/esp32-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: 'ESP32-BUS-001',
            action: 'offline'
          })
        });
        
        return NextResponse.json({
          success: true,
          message: 'ESP32 status reset to offline',
          timestamp: new Date().toISOString()
        });
        
      case 'simulate_online':
        // Set ESP32 as online for testing
        const onlineResponse = await fetch(`${new URL(request.url).protocol}//${new URL(request.url).host}/api/esp32-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: 'ESP32-BUS-001',
            action: 'online'
          })
        });
        
        return NextResponse.json({
          success: true,
          message: 'ESP32 status set to online',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ESP32 Admin Panel',
    availableActions: [
      'reset_esp32_status - Set all ESP32 devices to offline',
      'simulate_online - Set ESP32 to online for testing'
    ],
    usage: 'POST with {"action": "reset_esp32_status"} or {"action": "simulate_online"}'
  });
}