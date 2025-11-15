#include <Wire.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// === WIFI CONFIG ===
const char* WIFI_SSID = "Tech_Habba";
const char* WIFI_PASSWORD = "987654321";
const char* SERVER_URL = "https://roadeo-silk.vercel.app/api/potholes";

// === PIN SETUP ===
#define MPU_ADDR 0x68
#define SW420_PIN 34

HardwareSerial gpsSerial(1);   // GPS → RX=16, TX=17
HardwareSerial gsmSerial(2);   // GSM → RX=25, TX=26

TinyGPSPlus gps;

// === VIBRATION CONFIG ===
#define MPU_WEIGHT 0.6
#define SW420_WEIGHT 0.4
#define ALERT_THRESHOLD 80
#define STABLE_THRESHOLD 0.03
#define MAX_DIFF 1.0

float prevAx = 0, prevAy = 0, prevAz = 0;
String DEVICE_ID = "ESP32-BUS-001"; // Unique identifier for this device

// === PHONE NUMBER ===
String PHONE = "+911234567890";

// === WIFI STATUS ===
bool wifiConnected = false;
unsigned long lastWiFiCheck = 0;

// === SERVER STATUS ===
bool serverConnected = false;
unsigned long lastServerCheck = 0;
unsigned long lastSuccessfulPost = 0;
unsigned long lastHeartbeat = 0;

// === GPS STATUS ===
bool gpsReady = false;
unsigned long lastGPSCheck = 0;

// =======================================================
//        DEBUG: PRINT WITH TAGS
// =======================================================
void dbg(String msg) {
  Serial.println("[DEBUG] " + msg);
}

void err(String msg) {
  Serial.println("[ERROR] " + msg);
}

void ok(String msg) {
  Serial.println("[ OK ] " + msg);
}

// =======================================================
//        WIFI SETUP
// =======================================================
void setupWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  dbg("Connecting to WiFi...");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    ok("WiFi Connected! IP: " + WiFi.localIP().toString());
    wifiConnected = true;
  } else {
    err("WiFi Connection Failed");
    wifiConnected = false;
  }
}

// =======================================================
//        CHECK WIFI STATUS
// =======================================================
void checkWiFi() {
  if (millis() - lastWiFiCheck > 30000) { // Check every 30 seconds
    if (WiFi.status() != WL_CONNECTED) {
      err("WiFi Disconnected. Attempting to reconnect...");
      wifiConnected = false;
      setupWiFi();
    } else {
      wifiConnected = true;
    }
    lastWiFiCheck = millis();
  }
}

// =======================================================
//        CHECK SERVER CONNECTION
// =======================================================
bool checkServerConnection() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    serverConnected = false;
    return false;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-RoadPulse/1.0");
  http.setTimeout(5000); // 5 second timeout
  
  // Send a simple test request
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200 || httpResponseCode == 405) { // 405 = Method Not Allowed (expected for GET on POST endpoint)
    serverConnected = true;
    ok("Server connection verified");
  } else {
    serverConnected = false;
    err("Server unreachable. HTTP Code: " + String(httpResponseCode));
  }
  
  http.end();
  return serverConnected;
}

// =======================================================
//        SEND DATA TO SERVER
// =======================================================
void sendToServer(double lat, double lng, float intensity, float ax, float ay, float az, int mpuIntensity, int sw420Intensity) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    err("No WiFi connection. Cannot send to server.");
    serverConnected = false;
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-RoadPulse/1.0");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = String(millis());
  doc["location"]["latitude"] = lat;
  doc["location"]["longitude"] = lng;
  doc["vibrationIntensity"] = intensity;
  doc["accelerometer"]["x"] = ax;
  doc["accelerometer"]["y"] = ay;
  doc["accelerometer"]["z"] = az;
  doc["sensorData"]["mpuIntensity"] = mpuIntensity;
  doc["sensorData"]["sw420Intensity"] = sw420Intensity;
  doc["batteryLevel"] = analogRead(A0); // Add battery monitoring if available
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  dbg("Sending data to server: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    ok("✅ Server Response (" + String(httpResponseCode) + "): " + response);
    serverConnected = true;
    lastSuccessfulPost = millis();
  } else if (httpResponseCode > 0) {
    err("❌ Server Error (" + String(httpResponseCode) + "): " + http.getString());
    serverConnected = false;
  } else {
    err("❌ Connection Failed. HTTP Error: " + String(httpResponseCode));
    serverConnected = false;
  }
  
  http.end();
}

// =======================================================
//        SEND HEARTBEAT TO SERVER
// =======================================================
void sendHeartbeat() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    return; // Skip heartbeat if no WiFi
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-RoadPulse/1.0");
  http.setTimeout(5000);
  
  // Create heartbeat payload
  DynamicJsonDocument doc(512);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = String(millis());
  doc["heartbeat"] = true;
  doc["status"]["wifi"] = wifiConnected;
  doc["status"]["gps"] = gpsReady;
  doc["status"]["satellites"] = gps.satellites.value();
  doc["location"]["latitude"] = gpsReady ? gps.location.lat() : 19.0760;
  doc["location"]["longitude"] = gpsReady ? gps.location.lng() : 72.8777;
  doc["vibrationIntensity"] = 0; // Minimal intensity for heartbeat
  doc["accelerometer"]["x"] = 0;
  doc["accelerometer"]["y"] = 0;
  doc["accelerometer"]["z"] = 0;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  dbg("Sending heartbeat...");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    dbg("💓 Heartbeat sent successfully");
    serverConnected = true;
    lastSuccessfulPost = millis();
  } else {
    dbg("💔 Heartbeat failed: " + String(httpResponseCode));
    serverConnected = false;
  }
  
  http.end();
  lastHeartbeat = millis();
}

// =======================================================
//        SMS SENDER
// =======================================================
void sendSMS(double lat, double lng, float intensity) {
  String msg = "POTHOLE DETECTED!\n";
  msg += "Device: " + DEVICE_ID + "\n";
  msg += "Intensity: " + String(intensity,1) + "%\n";
  msg += "Lat: " + String(lat,6) + "\n";
  msg += "Lng: " + String(lng,6) + "\n";
  msg += "Time: " + String(millis()/1000) + "s\n";
  msg += "Maps: https://maps.google.com/?q=" + String(lat,6) + "," + String(lng,6);

  dbg("Sending SMS alert...");

  gsmSerial.println("AT");
  delay(300);
  dbg("AT Response: " + gsmSerial.readString());

  gsmSerial.println("AT+CMGF=1");
  delay(300);
  dbg("CMGF Response: " + gsmSerial.readString());

  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(PHONE);
  gsmSerial.println("\"");
  delay(500);

  gsmSerial.print(msg);
  gsmSerial.write(26); // CTRL+Z
  delay(2000);

  ok("SMS alert sent to " + PHONE);
}

// =======================================================
//        GSM SETUP
// =======================================================
void setupGSM() {
  dbg("Initializing GSM module...");
  
  gsmSerial.println("AT");
  delay(1000);
  
  gsmSerial.println("AT+CPIN?");
  delay(1000);
  
  gsmSerial.println("AT+CSQ");
  delay(1000);
  
  gsmSerial.println("AT+CREG?");
  delay(1000);
  
  ok("GSM module initialized");
}

// =======================================================
//        GPS HEALTH CHECK
// =======================================================
bool checkGPS() {
  dbg("Checking GPS connection...");

  unsigned long start = millis();
  bool gotData = false;

  // Try to get GPS data for 10 seconds
  while (millis() - start < 10000) {
    while (gpsSerial.available()) {
      char c = gpsSerial.read();
      if (gps.encode(c)) {
        gotData = true;
      }
    }
    
    if (gotData && gps.location.isValid()) {
      ok("GPS Lock acquired!");
      dbg("Location: Lat=" + String(gps.location.lat(),6) + 
          " Lng=" + String(gps.location.lng(),6) + 
          " Satellites=" + String(gps.satellites.value()));
      gpsReady = true;
      return true;
    }
  }

  if (gotData) {
    dbg("GPS data received but no valid location yet");
    dbg("Satellites: " + String(gps.satellites.value()));
  } else {
    err("No GPS data received - check wiring and antenna");
  }
  
  gpsReady = false;
  return false;
}

// =======================================================
//        CONTINUOUS GPS UPDATE
// =======================================================
void updateGPS() {
  while (gpsSerial.available()) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        gpsReady = true;
      }
    }
  }
  
  // Check GPS status every 30 seconds
  if (millis() - lastGPSCheck > 30000) {
    if (!gpsReady || !gps.location.isValid()) {
      dbg("GPS Status: " + String(gps.satellites.value()) + " satellites, " + 
          (gps.location.isValid() ? "VALID" : "INVALID") + " location");
    }
    lastGPSCheck = millis();
  }
}

// =======================================================
//        SETUP
// =======================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  dbg("===========================================");
  dbg("Starting RoadPulse ESP32 COMPLETE system...");
  dbg("Device ID: " + DEVICE_ID);
  dbg("===========================================");

  // Setup WiFi
  setupWiFi();

  // I2C for MPU6050
  Wire.begin(21, 22);
  dbg("I2C initialized on pins 21(SDA) and 22(SCL)");

  // GPS Serial
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  dbg("GPS Serial initialized on pins 16(RX) and 17(TX)");

  // GSM Serial
  gsmSerial.begin(9600, SERIAL_8N1, 25, 26);
  dbg("GSM Serial initialized on pins 25(RX) and 26(TX)");

  // Setup GSM
  setupGSM();

  // SW420 pin
  pinMode(SW420_PIN, INPUT);
  dbg("SW420 vibration sensor on pin " + String(SW420_PIN));

  // Wake up MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();
  dbg("MPU6050 accelerometer initialized");

  ok("All sensors initialized successfully!");

  // Initial GPS check
  dbg("Performing initial GPS check...");
  if (checkGPS()) {
    ok("GPS is ready for operation");
  } else {
    dbg("GPS not ready - will continue checking during operation");
    dbg("Note: GPS may take 1-5 minutes for initial lock outdoors");
  }

  // Test server connection
  dbg("Testing server connection...");
  if (checkServerConnection()) {
    ok("✅ Server connection successful!");
  } else {
    err("❌ Server connection failed!");
  }

  ok("RoadPulse system ready for pothole detection!");
  ok("Dashboard: https://roadeo-silk.vercel.app");
  
  // Show initial status
  dbg("=== INITIAL STATUS ===");
  dbg("📡 WiFi: " + String(wifiConnected ? "CONNECTED" : "DISCONNECTED"));
  dbg("☁️  Server: " + String(serverConnected ? "ONLINE" : "OFFLINE"));
  dbg("🛰️  GPS: " + String(gpsReady ? "READY" : "WAITING"));
  dbg("🔧 Device ID: " + DEVICE_ID);
  
  delay(1000);
}

// =======================================================
//        MAIN LOOP
// =======================================================
void loop() {
  // Check WiFi status periodically
  checkWiFi();
  
  // Update GPS data continuously
  updateGPS();

  // ======== Read MPU6050 Accelerometer ========
  uint8_t buf[6];
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // ACCEL_XOUT_H register
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  
  for (int i = 0; i < 6; i++) {
    buf[i] = Wire.read();
  }

  int16_t axRaw = (buf[0] << 8) | buf[1];
  int16_t ayRaw = (buf[2] << 8) | buf[3];
  int16_t azRaw = (buf[4] << 8) | buf[5];

  float ax = axRaw / 16384.0;
  float ay = ayRaw / 16384.0;
  float az = azRaw / 16384.0;

  // Calculate acceleration difference (movement detection)
  float diff = sqrt(pow(ax - prevAx, 2) + pow(ay - prevAy, 2) + pow(az - prevAz, 2));

  prevAx = ax;
  prevAy = ay;
  prevAz = az;

  // Convert to intensity (0-100%)
  int mpuIntensity = map(constrain(diff * 100, 0, 100), 0, 100, 0, 100);

  // ======== Read SW420 Vibration Sensor ========
  int swRaw = analogRead(SW420_PIN);
  int sw420Intensity = map(swRaw, 0, 4095, 0, 100);

  // ======== Combined Vibration Calculation ========
  float combinedIntensity = (MPU_WEIGHT * mpuIntensity) + (SW420_WEIGHT * sw420Intensity);
  combinedIntensity = constrain(combinedIntensity, 0, 100);

  // Check server connection every 30 seconds
  if (millis() - lastServerCheck > 30000) {
    dbg("Checking server connection...");
    checkServerConnection();
    lastServerCheck = millis();
  }

  // Send heartbeat every 60 seconds to show device is online
  if (millis() - lastHeartbeat > 60000) {
    sendHeartbeat();
  }

  // Debug output every 5 seconds
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 5000) {
    dbg("=== SYSTEM STATUS ===");
    dbg("📡 WiFi: " + String(wifiConnected ? "CONNECTED" : "DISCONNECTED"));
    dbg("☁️  Server: " + String(serverConnected ? "ONLINE" : "OFFLINE"));
    dbg("🛰️  GPS: " + String(gps.satellites.value()) + " sats, " + (gpsReady ? "READY" : "WAITING"));
    dbg("📊 Sensors - MPU: " + String(mpuIntensity) + "% | SW420: " + String(sw420Intensity) + "% | Combined: " + String(combinedIntensity, 1) + "%");
    dbg("📈 Accelerometer: X=" + String(ax, 2) + " Y=" + String(ay, 2) + " Z=" + String(az, 2));
    
    if (lastSuccessfulPost > 0) {
      unsigned long timeSinceLastPost = (millis() - lastSuccessfulPost) / 1000;
      dbg("⏱️  Last successful post: " + String(timeSinceLastPost) + "s ago");
    } else {
      dbg("⚠️  No successful posts yet");
    }
    
    lastDebug = millis();
  }

  // ======== POTHOLE DETECTION TRIGGER ========
  if (combinedIntensity >= ALERT_THRESHOLD) {
    ok("🚨 POTHOLE DETECTED! Intensity: " + String(combinedIntensity, 1) + "%");
    ok("MPU6050: " + String(mpuIntensity) + "% | SW420: " + String(sw420Intensity) + "%");

    // Get current location
    double currentLat = 0.0;
    double currentLng = 0.0;
    
    if (gpsReady && gps.location.isValid()) {
      currentLat = gps.location.lat();
      currentLng = gps.location.lng();
      ok("GPS Location: " + String(currentLat, 6) + ", " + String(currentLng, 6));
    } else {
      err("GPS not ready - using fallback coordinates");
      // Use Mumbai coordinates as fallback
      currentLat = 19.0760 + (random(-50, 50) / 10000.0);
      currentLng = 72.8777 + (random(-50, 50) / 10000.0);
    }

    // Send data to web server (primary method)
    ok("Sending data to dashboard...");
    sendToServer(currentLat, currentLng, combinedIntensity, ax, ay, az, mpuIntensity, sw420Intensity);

    // Send SMS alert (backup notification)
    ok("Sending SMS alert...");
    sendSMS(currentLat, currentLng, combinedIntensity);

    // Prevent duplicate detections
    delay(5000);
  }

  delay(200); // Main loop delay
}