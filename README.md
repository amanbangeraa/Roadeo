# 🛣️ RoadPulse - ESP32 Pothole Detection System

A real-time pothole detection and monitoring system using ESP32 sensors with a modern web dashboard built with Next.js.

## 🚀 Live Demo

- **Web Dashboard**: [https://roadeo-silk.vercel.app](https://roadeo-silk.vercel.app)
- **API Endpoint**: `/api/potholes`

## 🎯 Project Overview

RoadPulse is an IoT-based pothole detection system that uses ESP32 microcontroller with multiple sensors to detect road surface irregularities and report them to a real-time web dashboard with Google Maps integration.

### Key Features

✅ **Real-time Pothole Detection** using dual sensors  
✅ **GPS Location Tracking** for precise coordinates  
✅ **Web Dashboard** with Google Maps integration  
✅ **SMS Alerts** via GSM module  
✅ **Multiple Detection Methods** (MPU6050 + SW420)  
✅ **WiFi Connectivity** for cloud reporting  
✅ **Battery Monitoring** and device tracking  
✅ **Severity Classification** (Low/Medium/High)

## 🔧 Hardware Requirements

### Complete System
- ESP32 Development Board
- MPU6050 Accelerometer/Gyroscope
- SW420 Vibration Sensor
- GPS Module (NEO-6M or compatible)
- SIM800L GSM Module
- Jumper wires and breadboard
- Power supply (12V for vehicle mounting)

### Quick Test Setup
- ESP32 Development Board
- MPU6050 Accelerometer only
- 4 Jumper wires
- USB cable for programming

## 📋 Pin Configuration

```
ESP32 Pin → Component
   21     → MPU6050 SDA
   22     → MPU6050 SCL
   16     → GPS Module TX
   17     → GPS Module RX
   25     → GSM Module TX
   26     → GSM Module RX
   34     → SW420 Digital Pin
   3.3V   → Power for sensors
   GND    → Common Ground
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/amanbangeraa/Roadeo.git
cd Roadeo
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Deploy Web Dashboard
```bash
npm run build
npx vercel --prod
```

### 4. ESP32 Setup

#### Quick Test (MPU6050 only)
1. Upload `ESP32_Simple_Test.ino`
2. Update WiFi credentials in code
3. Shake ESP32 to trigger detection
4. Check dashboard for markers

#### Complete System
1. Wire all components as shown above
2. Upload `ESP32_Complete_System.ino`
3. Update WiFi credentials and phone number
4. Deploy in vehicle for real testing

## 📊 System Architecture

```
ESP32 Sensors → Data Processing → WiFi → API Endpoint → Web Dashboard
     ↓              ↓              ↓         ↓            ↓
   MPU6050      Calculate      Send JSON   Store Data   Display Map
   SW420        Intensity      via HTTP    in Memory    with Markers
   GPS          Get Location   POST        Process      Real-time Updates
   GSM          Send SMS       WiFi        Severity     Auto-refresh
```

## 🔌 API Endpoints

### POST /api/potholes
Receive pothole data from ESP32
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
    "x": 0.12, "y": -0.05, "z": 0.98
  },
  "sensorData": {
    "mpuIntensity": 45,
    "sw420Intensity": 30
  },
  "batteryLevel": 85
}
```

### GET /api/potholes
Retrieve stored pothole data
```json
{
  "potholes": [...],
  "count": 42
}
```

## 🛠️ Tech Stack

### Hardware
- **ESP32** - Main microcontroller
- **MPU6050** - 6-axis accelerometer/gyroscope
- **SW420** - Vibration detection sensor
- **GPS Module** - Location tracking
- **SIM800L** - GSM/SMS communication

### Software
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Maps API** - Map integration
- **Vercel** - Deployment platform
- **Arduino IDE** - ESP32 programming

### Libraries
- **ArduinoJson** - JSON handling on ESP32
- **TinyGPSPlus** - GPS data parsing
- **WiFi & HTTPClient** - Network communication

## 📱 Dashboard Features

- 🗺️ **Interactive Google Maps** with real-time markers
- 📍 **Pothole Locations** with GPS coordinates
- 🎨 **Severity Color Coding** (Red/Orange/Yellow)
- 🔄 **Auto-refresh** every 30 seconds
- 📊 **Device Status** and battery levels
- 📧 **SMS Integration** for critical alerts
- 📈 **Analytics Dashboard** (future feature)

## 🧪 Testing Guide

### Quick Test Setup
1. **Hardware**: Connect only MPU6050 to ESP32
2. **Software**: Upload `ESP32_Simple_Test.ino`
3. **Test**: Shake ESP32 board to trigger detection
4. **Verify**: Check dashboard for new markers
5. **Debug**: Monitor Serial output at 115200 baud

### Production Testing
1. **Vehicle Mount**: Install complete system in vehicle
2. **Road Test**: Drive on roads with known potholes
3. **Calibrate**: Adjust `ALERT_THRESHOLD` as needed
4. **Monitor**: Check GPS accuracy and cellular coverage
5. **Optimize**: Fine-tune sensor weights and sensitivity

## 🔧 Configuration Options

### ESP32 Settings
```cpp
#define ALERT_THRESHOLD 80        // Detection sensitivity (0-100)
#define MPU_WEIGHT 0.6           // MPU6050 influence (0-1)
#define SW420_WEIGHT 0.4         // SW420 influence (0-1)
```

### WiFi Configuration
```cpp
const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_Password";
```

## 🚨 Troubleshooting

### Common Issues

**ESP32 won't connect to WiFi**
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check SSID/password spelling
- Try mobile hotspot for testing

**GPS not getting location**
- Ensure outdoor testing (GPS needs sky view)
- Wait 1-5 minutes for initial satellite lock
- Check antenna connections

**No data on dashboard**
- Verify WiFi connection on ESP32
- Check server URL is correct
- Monitor Serial output for HTTP errors
- Refresh browser page manually

**False positives**
- Lower the `ALERT_THRESHOLD` value
- Adjust sensor weights (`MPU_WEIGHT`, `SW420_WEIGHT`)
- Check sensor mounting (reduce vibrations)

## 📈 Future Enhancements

- [ ] **Database Integration** (PostgreSQL/MongoDB)
- [ ] **Real-time WebSocket** updates
- [ ] **Machine Learning** for better detection accuracy
- [ ] **Mobile App** for field teams
- [ ] **Analytics Dashboard** with charts and statistics
- [ ] **Multi-device Management** and fleet tracking
- [ ] **Weather Integration** for context
- [ ] **Repair Scheduling** and workflow management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Adithya**
- **Dhanush G.**

## 📞 Contact

- **GitHub**: [@amanbangeraa](https://github.com/amanbangeraa)
- **Project Link**: [https://github.com/amanbangeraa/Roadeo](https://github.com/amanbangeraa/Roadeo)
- **Live Demo**: [https://roadeo-silk.vercel.app](https://roadeo-silk.vercel.app)

---

**Built with ❤️ for safer roads and better infrastructure**
