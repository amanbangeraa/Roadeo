export type Severity = 'low' | 'medium' | 'high';
export type Status = 'reported' | 'verified' | 'assigned' | 'in_progress' | 'completed';
export type UserRole = 'municipal_agent' | 'vehicle_owner' | 'public';

export interface Pothole {
  id: string;
  timestamp: string;
  gps: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vibrationIntensity: number;
  severityLevel: Severity;
  deviceId: string;
  vehicleInfo: {
    type: string;
    owner: string;
    registrationNumber: string;
  };
  status: Status;
  assignedTo: string | null;
  priority: string;
  notes: { text: string; author: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
  repairedAt: string | null;
  repairedBy: string | null;
}

const locations = [
  { address: 'Anna Salai, Chennai', lat: 13.0827, lng: 80.2707 },
  { address: 'MG Road, Bangalore', lat: 12.9352, lng: 77.6245 },
  { address: 'Marine Drive, Mumbai', lat: 18.9432, lng: 72.8236 },
  { address: 'Brigade Road, Bangalore', lat: 12.9716, lng: 77.6412 },
  { address: 'Connaught Place, Delhi', lat: 28.6328, lng: 77.1902 },
  { address: 'Bandra-Worli Road, Mumbai', lat: 19.0176, lng: 72.8298 },
  { address: 'Indiranagar, Bangalore', lat: 12.9716, lng: 77.6413 },
  { address: 'Karol Bagh, Delhi', lat: 28.6505, lng: 77.1819 },
  { address: 'Fort, Mumbai', lat: 18.9641, lng: 72.8347 },
  { address: 'Whitefield, Bangalore', lat: 12.9698, lng: 77.7499 },
];

const statuses: Status[] = ['reported', 'verified', 'assigned', 'in_progress', 'completed'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const vehicleTypes = ['Bus', 'Truck', 'Auto', 'Car', 'Taxi'];
const operators = ['MTC Chennai', 'BMTC Bangalore', 'BEST Mumbai', 'DTC Delhi', 'Private Operator'];

const deviceIds = Array.from({ length: 15 }, (_, i) => `ESP32-${['BUS', 'TRUCK', 'AUTO'][i % 3]}-${String(i + 1).padStart(3, '0')}`);

export function generateMockPotholes(count: number = 75): Pothole[] {
  const potholes: Pothole[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);

    const location = locations[Math.floor(Math.random() * locations.length)];
    const vibration = Math.random() * 100;
    let severity: Severity = 'low';
    if (vibration > 80) severity = 'high';
    else if (vibration > 40) severity = 'medium';

    const statusIndex = Math.floor(Math.random() * 5);
    const status = statuses[statusIndex];

    const completedDate = new Date(date);
    completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 5) + 2);

    potholes.push({
      id: `PTH-2024-${String(i + 1).padStart(3, '0')}`,
      timestamp: date.toISOString(),
      gps: {
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        address: location.address,
      },
      vibrationIntensity: Math.round(vibration * 10) / 10,
      severityLevel: severity,
      deviceId: deviceIds[Math.floor(Math.random() * deviceIds.length)],
      vehicleInfo: {
        type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
        owner: operators[Math.floor(Math.random() * operators.length)],
        registrationNumber: `IN${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      },
      status,
      assignedTo: status !== 'reported' ? `Team ${Math.floor(Math.random() * 5) + 1}` : null,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      notes:
        status === 'in_progress' || status === 'completed'
          ? [
              {
                text: 'Repair in progress',
                author: 'Municipal Agent',
                timestamp: new Date(date.getTime() + 86400000).toISOString(),
              },
            ]
          : [],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      repairedAt: status === 'completed' ? completedDate.toISOString() : null,
      repairedBy: status === 'completed' ? 'Repair Team 1' : null,
    });
  }

  return potholes;
}
