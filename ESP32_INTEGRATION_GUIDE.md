# ESP32 RoadPulse Integration Guide

## 🚀 Complete ESP32 to Web App Integration

### 1. Hardware Setup

**Required Components:**
- ESP32 Development Board
- MPU6050 Accelerometer/Gyroscope
- SW420 Vibration Sensor
- GPS Module (NEO-6M or similar)
- SIM800L GSM Module (optional)
- Jumper wires and breadboard

**Wiring Diagram:**
```
ESP32 → Component
21    → MPU6050 SDA
22    → MPU6050 SCL
16    → GPS Module TX
17    → GPS Module RX
25    → GSM Module TX
26    → GSM Module RX
34    → SW420 Digital Pin
3V3   → Power for sensors
GND   → Common Ground
```

### 2. ESP32 Code Configuration

Your ESP32 code is already configured with the correct server URL:

**Current Configuration:**
- **Server URL**: `https://roadeo-ejkm9wkgr-amanbangeraas-projects.vercel.app/api/potholes`
- **Device ID**: `ESP32-BUS-001`
- **Alert Threshold**: 80% vibration intensity

**Update WiFi Credentials:**
```cpp
const char* WIFI_SSID = "YOUR_ACTUAL_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_ACTUAL_WIFI_PASSWORD";
```

### 3. Data Flow Overview

```
ESP32 Sensors → Data Processing → WiFi → API Endpoint → Web Dashboard
     ↓              ↓              ↓         ↓            ↓
   MPU6050     Calculate      Send JSON   Store Data   Display Map
   SW420       Intensity      via HTTP    in Memory    with Markers
   GPS         Get Location   POST        Process      Real-time Updates
```

### 4. Testing the Integration

#### A. Test with Simulated Data

1. **Visit Test Endpoint:**
   ```
   POST https://roadeo-ejkm9wkgr-amanbangeraas-projects.vercel.app/api/test-esp32
   ```

2. **Test via Browser Console:**
   ```javascript
   fetch('/api/test-esp32', { method: 'POST' })
     .then(r => r.json())
     .then(console.log);
   ```

#### B. Test with Real ESP32

1. **Upload the Arduino code** to your ESP32
2. **Open Serial Monitor** (115200 baud rate)
3. **Monitor debug messages:**
   ```
   [DEBUG] Starting RoadPulse ESP32 system...
   [ OK ] WiFi Connected! IP: 192.168.1.100
   [ OK ] GPS FIX Acquired
   [DEBUG] MPU=45 SW420=30 Combined=85.5%
   [ OK ] POTHOLE DETECTED! Intensity: 85.5%
   [ OK ] Server Response (200): {"success":true,"potholeId":"ESP32-ESP32-BUS-001-1699999999999"}
   ```

### 5. Web Dashboard Integration

The data automatically appears on your dashboard:

**View Real-time Data:**
1. Visit: `https://roadeo-ejkm9wkgr-amanbangeraas-projects.vercel.app`
2. Check the map for pothole markers
3. Data refreshes every 30 seconds automatically

**API Endpoints:**
- **POST** `/api/potholes` - Receive ESP32 data
- **GET** `/api/potholes` - Retrieve all potholes
- **POST** `/api/test-esp32` - Generate test data

### 6. Data Format

**ESP32 sends this JSON structure:**
```json
{
  "deviceId": "ESP32-BUS-001",
  "timestamp": "1699999999999",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "vibrationIntensity": 85.5,
  "accelerometer": {
    "x": 0.12,
    "y": -0.05,
    "z": 0.98
  },
  "sensorData": {
    "mpuIntensity": 45,
    "sw420Intensity": 30
  },
  "batteryLevel": 85
}
```

**Server processes it to:**
```json
{
  "id": "ESP32-ESP32-BUS-001-1699999999999",
  "timestamp": "2024-01-01T10:30:00.000Z",
  "gps": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "address": "Lat: 19.076000, Lng: 72.877700"
  },
  "vibrationIntensity": 85.5,
  "severityLevel": "high",
  "deviceId": "ESP32-BUS-001",
  "vehicleInfo": {
    "type": "Bus",
    "owner": "Public Transport",
    "registrationNumber": "ESP32-BUS-001"
  },
  "status": "reported",
  "priority": "Critical"
}
```

### 7. Troubleshooting

#### Common Issues:

**WiFi Connection Issues:**
```
[ERROR] WiFi Connection Failed
```
**Solution:** Check SSID/Password, ensure 2.4GHz network

**GPS Issues:**
```
[ERROR] GPS NOT DETECTED. No NMEA data.
```
**Solution:** Check wiring, ensure outdoor location for GPS lock

**Server Connection Issues:**
```
[ERROR] HTTP Error: -1
```
**Solution:** Check internet connection, verify server URL

**No Data on Dashboard:**
**Solution:** Check browser console, verify API endpoint responses

#### Debug Commands:

**Test API directly:**
```bash
curl -X POST https://roadeo-ejkm9wkgr-amanbangeraas-projects.vercel.app/api/test-esp32
```

**Check stored data:**
```bash
curl https://roadeo-ejkm9wkgr-amanbangeraas-projects.vercel.app/api/potholes
```

### 8. Quick Test Setup (Recommended for First Time)

**Simple Test Without GPS/GSM:**

Use `ESP32_Simple_Test.ino` for immediate testing:

**Hardware Required:**
- ESP32 Board
- MPU6050 Accelerometer only
- Jumper wires

**Wiring:**
```
ESP32 → MPU6050
21    → SDA
22    → SCL
3V3   → VCC
GND   → GND
```

**Features:**
- ✅ Only MPU6050 vibration detection
- ✅ No GPS/GSM required
- ✅ Uses test coordinates for mapping
- ✅ Lower threshold (50%) for easy testing
- ✅ Immediate dashboard display

**How to Test:**
1. Upload `ESP32_Simple_Test.ino`
2. Update WiFi credentials
3. Shake or tap the ESP32 board
4. Watch Serial Monitor for detection
5. Check dashboard for new markers

**Expected Output:**
```
[DEBUG] Vibration Intensity: 45.2% (Threshold: 50%)
[ OK ] 🚨 POTHOLE DETECTED! Intensity: 67.8%
[ OK ] Server Response (200): {"success":true}
```

### 9. Production Enhancements

**For Production Use:**

1. **Database Integration:**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Add data persistence across deployments

2. **Real-time Updates:**
   - Implement WebSocket connections
   - Add Server-Sent Events for live updates

3. **Security:**
   - Add API authentication
   - Implement rate limiting
   - Validate GPS coordinates

4. **Monitoring:**
   - Add device health monitoring
   - Battery level alerts
   - Connection status tracking

### 9. Next Steps

1. **Upload ESP32 Code:**
   - Flash `ESP32_RoadPulse_Integration.ino` to your ESP32
   - Update WiFi credentials

2. **Test Integration:**
   - Use test endpoint to verify data flow
   - Check dashboard for incoming data

3. **Deploy Physical Setup:**
   - Install in vehicle
   - Test in real road conditions
   - Monitor data quality

**Your ESP32 integration is ready! 🎉**

The system will automatically:
- ✅ Detect potholes using sensors
- ✅ Send GPS coordinates 
- ✅ Display on web dashboard
- ✅ Process severity levels
- ✅ Store and retrieve data