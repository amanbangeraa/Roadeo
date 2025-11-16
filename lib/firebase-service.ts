import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-config';
import { PotholeDocument, DeviceDocument, UserDocument } from './firebase-schema';

// Check if Firebase is properly initialized
function ensureFirebaseInitialized() {
  if (!db) {
    console.warn('Firebase not initialized - some features may not work properly');
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
}

// ===== POTHOLE OPERATIONS =====

export const potholeService = {
  // Add new pothole from ESP32
  async createPothole(data: Omit<PotholeDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      ensureFirebaseInitialized();
      const docRef = await addDoc(collection(db, 'potholes'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Pothole created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating pothole:', error);
      throw error;
    }
  },

  // Get all potholes with optional filters
  async getPotholes(filters?: {
    deviceId?: string;
    severityLevel?: 'low' | 'medium' | 'high';
    status?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      let q = query(collection(db, 'potholes'), orderBy('timestamp', 'desc'));

      if (filters?.deviceId) {
        q = query(q, where('deviceId', '==', filters.deviceId));
      }
      if (filters?.severityLevel) {
        q = query(q, where('severityLevel', '==', filters.severityLevel));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (PotholeDocument & { id: string })[];
    } catch (error) {
      console.error('Error fetching potholes:', error);
      throw error;
    }
  },

  // Update pothole status
  async updatePotholeStatus(id: string, status: PotholeDocument['status'], updateData?: Partial<PotholeDocument>) {
    try {
      const docRef = doc(db, 'potholes', id);
      await updateDoc(docRef, {
        status,
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating pothole status:', error);
      throw error;
    }
  },

  // Real-time listener for new potholes
  subscribeToNewPotholes(callback: (potholes: (PotholeDocument & { id: string })[]) => void) {
    const q = query(
      collection(db, 'potholes'), 
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const potholes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (PotholeDocument & { id: string })[];
      callback(potholes);
    });
  }
};

// ===== DEVICE OPERATIONS =====

export const deviceService = {
  // Register new device
  async registerDevice(deviceData: Omit<DeviceDocument, 'createdAt' | 'updatedAt' | 'lastSeen'>) {
    try {
      await addDoc(collection(db, 'devices'), {
        ...deviceData,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  },

  // Update device heartbeat
  async updateDeviceHeartbeat(deviceId: string, location?: { latitude: number; longitude: number }) {
    try {
      const q = query(collection(db, 'devices'), where('id', '==', deviceId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        const updateData: any = {
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        if (location) {
          updateData.location = {
            ...location,
            lastUpdate: serverTimestamp(),
          };
        }
        
        await updateDoc(docRef, updateData);
      }
    } catch (error) {
      console.error('Error updating device heartbeat:', error);
      throw error;
    }
  },

  // Get all devices
  async getDevices() {
    try {
      const querySnapshot = await getDocs(collection(db, 'devices'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as (DeviceDocument & { id: string })[];
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }
};

// ===== ANALYTICS OPERATIONS =====

export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats(dateRange?: { start: Date; end: Date }) {
    try {
      let potholeQuery = query(collection(db, 'potholes'));
      
      if (dateRange) {
        potholeQuery = query(
          potholeQuery, 
          where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(dateRange.end))
        );
      }
      
      const [potholesSnapshot, devicesSnapshot] = await Promise.all([
        getDocs(potholeQuery),
        getDocs(collection(db, 'devices'))
      ]);
      
      const potholes = potholesSnapshot.docs.map(doc => doc.data());
      const devices = devicesSnapshot.docs.map(doc => doc.data());
      
      return {
        totalPotholes: potholes.length,
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        severityBreakdown: {
          low: potholes.filter(p => p.severityLevel === 'low').length,
          medium: potholes.filter(p => p.severityLevel === 'medium').length,
          high: potholes.filter(p => p.severityLevel === 'high').length,
        },
        statusBreakdown: {
          reported: potholes.filter(p => p.status === 'reported').length,
          verified: potholes.filter(p => p.status === 'verified').length,
          inProgress: potholes.filter(p => p.status === 'in-progress').length,
          resolved: potholes.filter(p => p.status === 'resolved').length,
        },
        recentPotholes: potholes
          .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Generate daily analytics
  async generateDailyAnalytics(date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const stats = await this.getDashboardStats({
        start: startOfDay,
        end: endOfDay
      });
      
      // Store daily analytics
      const analyticsDoc = {
        id: date.toISOString().split('T')[0], // YYYY-MM-DD
        date: Timestamp.fromDate(date),
        metrics: {
          totalDetections: stats.totalPotholes,
          deviceCount: stats.totalDevices,
          activeDevices: stats.activeDevices,
          severityBreakdown: stats.severityBreakdown,
          resolutionStats: stats.statusBreakdown,
          avgResponseTime: 0, // Calculate based on resolution times
        },
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'analytics'), analyticsDoc);
    } catch (error) {
      console.error('Error generating daily analytics:', error);
      throw error;
    }
  }
};

// ===== NOTIFICATION OPERATIONS =====

export const notificationService = {
  // Send notification
  async sendNotification(notification: {
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    recipientIds: string[];
    relatedDocuments?: any;
  }) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        readBy: [],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const readBy = data.readBy || [];
        
        if (!readBy.includes(userId)) {
          await updateDoc(docRef, {
            readBy: [...readBy, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

// ===== SIMPLIFIED API FOR WEBHOOK USAGE =====

/**
 * Add pothole record from SMS/webhook data
 * This function handles data from various sources including SMS
 */
export async function addPotholeRecord(data: {
  deviceId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vibrationIntensity: number;
  source?: string;
  satellites?: number;
  processedAt?: string;
  rawSMS?: string;
  accelerometer?: {
    x: number;
    y: number;
    z: number;
  };
  sensorData?: {
    mpuIntensity: number;
    sw420Intensity: number;
  };
}) {
  try {
    // Determine severity level based on vibration intensity
    let severityLevel: 'low' | 'medium' | 'high' = 'low';
    if (data.vibrationIntensity >= 80) {
      severityLevel = 'high';
    } else if (data.vibrationIntensity >= 50) {
      severityLevel = 'medium';
    }

    // Create the document structure
    const potholeDoc = {
      deviceId: data.deviceId,
      timestamp: serverTimestamp(), // Use server timestamp for consistency
      location: new GeoPoint(data.location.latitude, data.location.longitude),
      vibrationIntensity: data.vibrationIntensity,
      severityLevel,
      status: 'reported' as const,
      source: data.source || 'SMS',
      metadata: {
        satellites: data.satellites || 0,
        processedAt: data.processedAt || new Date().toISOString(),
        rawData: data.rawSMS || '',
        accelerometer: data.accelerometer || null,
        sensorData: data.sensorData || null,
      },
      alerts: {
        smsAlert: true,
        webAlert: data.source !== 'SMS',
        notificationSent: false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'potholes'), potholeDoc);
    
    console.log('✅ Pothole record created:', {
      id: docRef.id,
      deviceId: data.deviceId,
      intensity: data.vibrationIntensity,
      source: data.source
    });

    // Update device heartbeat with location
    await deviceService.updateDeviceHeartbeat(data.deviceId, {
      latitude: data.location.latitude,
      longitude: data.location.longitude
    });

    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding pothole record:', error);
    throw error;
  }
}