// Mock data file - No longer used in production
// All data now comes from real ESP32 devices via SMS/Twilio webhook → Firebase
// This file is kept for potential future testing but is not used by the application

export function generateMockPotholes(count?: number) {
  console.warn('🚨 generateMockPotholes called - This should not be used in production!');
  console.warn('All data should come from real ESP32 devices via SMS → Twilio → Firebase');
  return [];
}

// Export mock devices for testing
export interface Device {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen: string;
  batteryLevel?: number;
}

export function generateMockDevices(): Device[] {
  return [
    {
      id: 'ESP32-BUS-001',
      name: 'Bus Route 001',
      status: 'active',
      location: {
        latitude: 19.0760,
        longitude: 72.8777
      },
      lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      batteryLevel: 85
    },
    {
      id: 'ESP32-BUS-002',
      name: 'Bus Route 002',
      status: 'active',
      location: {
        latitude: 19.0820,
        longitude: 72.8840
      },
      lastSeen: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      batteryLevel: 72
    },
    {
      id: 'ESP32-BUS-003',
      name: 'Bus Route 003',
      status: 'maintenance',
      location: {
        latitude: 19.0890,
        longitude: 72.8950
      },
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      batteryLevel: 23
    }
  ];
}
