const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample locations in different cities
const locations = [
  { address: 'Anna Salai, Chennai', lat: 13.0827, lng: 80.2707 },
  { address: 'MG Road, Bangalore', lat: 12.9352, lng: 77.6245 },
  { address: 'Marine Drive, Mumbai', lat: 18.9432, lng: 72.8236 },
  { address: 'Brigade Road, Bangalore', lat: 12.9716, lng: 77.6412 },
  { address: 'Connaught Place, Delhi', lat: 28.6328, lng: 77.1902 },
];

const deviceIds = [
  'ESP32-BUS-001',
  'ESP32-TRUCK-002', 
  'ESP32-AUTO-003',
  'ESP32-BUS-004',
  'ESP32-TRUCK-005'
];

const vehicleTypes = ['Bus', 'Truck', 'Auto', 'Car', 'Taxi'];
const operators = ['MTC Chennai', 'BMTC Bangalore', 'BEST Mumbai', 'DTC Delhi', 'Private Operator'];

function generatePotholeData() {
  const location = locations[Math.floor(Math.random() * locations.length)];
  const vibrationIntensity = Math.random() * 100;
  let severityLevel = 'low';
  
  if (vibrationIntensity > 80) severityLevel = 'high';
  else if (vibrationIntensity > 40) severityLevel = 'medium';

  const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
  const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  return {
    id: `PTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    gps: {
      latitude: location.lat + (Math.random() - 0.5) * 0.01,
      longitude: location.lng + (Math.random() - 0.5) * 0.01,
      address: location.address
    },
    vibrationIntensity: Math.round(vibrationIntensity * 10) / 10,
    severityLevel: severityLevel,
    deviceId: deviceId,
    vehicleInfo: {
      type: vehicleType,
      owner: operator,
      registrationNumber: `IN${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    },
    status: 'reported',
    assignedTo: null,
    priority: severityLevel === 'high' ? 'Critical' : severityLevel === 'medium' ? 'High' : 'Medium',
    notes: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    repairedAt: null,
    repairedBy: null
  };
}

async function addSimulatedData() {
  try {
    console.log('🚀 Starting ESP32 data simulation...');
    console.log('📡 Adding sample pothole data to Firebase...');
    
    // Add 5 sample potholes
    for (let i = 0; i < 5; i++) {
      const potholeData = generatePotholeData();
      console.log(`Adding pothole ${i + 1}: ${potholeData.gps.address} - Severity: ${potholeData.severityLevel}`);
      
      const docRef = await addDoc(collection(db, 'potholes'), potholeData);
      console.log(`✅ Pothole added with ID: ${docRef.id}`);
      
      // Wait 2 seconds between additions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎉 Successfully added 5 sample potholes!');
    console.log('🔄 Check your dashboard - it should now show the pothole data');
    
  } catch (error) {
    console.error('❌ Error adding simulated data:', error);
  }
}

// Run the simulation
addSimulatedData();
