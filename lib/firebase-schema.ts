// Firebase Firestore Database Schema for RoadPulse System

// Collection: potholes
export interface PotholeDocument {
  id: string;                    // Auto-generated document ID
  deviceId: string;              // ESP32 device identifier
  timestamp: Date;               // Detection timestamp
  location: {
    latitude: number;
    longitude: number;
    address?: string;            // Reverse geocoded address
    accuracy?: number;           // GPS accuracy in meters
  };
  vibrationIntensity: number;    // Combined vibration intensity (0-100)
  severityLevel: 'low' | 'medium' | 'high';
  sensorData: {
    mpuIntensity: number;        // MPU6050 readings
    sw420Intensity: number;      // SW420 readings
    accelerometer: {
      x: number;
      y: number;
      z: number;
    };
  };
  deviceInfo: {
    batteryLevel?: number;
    signalStrength?: number;
    firmwareVersion?: string;
  };
  status: 'reported' | 'verified' | 'in-progress' | 'resolved' | 'false-positive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;           // Field team member ID
  verificationData?: {
    verifiedBy: string;
    verificationDate: Date;
    actualSeverity: 'low' | 'medium' | 'high';
    photos?: string[];           // Storage URLs
  };
  resolutionData?: {
    resolvedBy: string;
    resolutionDate: Date;
    repairMethod: string;
    cost?: number;
    beforePhotos?: string[];
    afterPhotos?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Collection: devices
export interface DeviceDocument {
  id: string;                    // Device ID (ESP32-BUS-001, etc.)
  name: string;                  // Human-readable name
  type: 'vehicle' | 'stationary' | 'mobile';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  lastSeen: Date;
  location: {
    latitude: number;
    longitude: number;
    lastUpdate: Date;
  };
  vehicleInfo?: {
    registrationNumber: string;
    driver: string;
    route: string;
    organization: string;
  };
  configuration: {
    alertThreshold: number;
    mpuWeight: number;
    sw420Weight: number;
    reportingInterval: number;
  };
  stats: {
    totalDetections: number;
    lastDetection?: Date;
    uptime: number;
    batteryLevel: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Collection: users
export interface UserDocument {
  id: string;                    // User UID from Firebase Auth
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'field-tech' | 'viewer';
  permissions: {
    canViewAll: boolean;
    canManageDevices: boolean;
    canAssignTasks: boolean;
    canResolveIssues: boolean;
  };
  assignedDevices?: string[];    // Device IDs
  contactInfo: {
    phone?: string;
    organization: string;
  };
  createdAt: Date;
  lastLogin: Date;
}

// Collection: analytics
export interface AnalyticsDocument {
  id: string;                    // Date-based ID (YYYY-MM-DD)
  date: Date;
  metrics: {
    totalDetections: number;
    deviceCount: number;
    activeDevices: number;
    severityBreakdown: {
      low: number;
      medium: number;
      high: number;
    };
    resolutionStats: {
      resolved: number;
      pending: number;
      inProgress: number;
    };
    avgResponseTime: number;     // Hours
    topDevices: Array<{
      deviceId: string;
      detectionCount: number;
    }>;
  };
  createdAt: Date;
}

// Collection: notifications
export interface NotificationDocument {
  id: string;
  type: 'pothole-detected' | 'device-offline' | 'low-battery' | 'assignment' | 'resolution';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recipientIds: string[];       // User IDs
  readBy: string[];            // User IDs who read it
  relatedDocuments: {
    potholeId?: string;
    deviceId?: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}