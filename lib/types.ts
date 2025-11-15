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

export interface FilterState {
  severity: Severity | 'all';
  status: Status | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
  deviceId: string | 'all';
  searchLocation: string;
}
