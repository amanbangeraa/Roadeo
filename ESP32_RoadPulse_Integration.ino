#include <Wire.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// === WIFI CONFIG ===
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "https://roadeo-mj41o7x2z-amanbangeraas-projects.vercel.app/api/potholes";

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
//        SEND DATA TO SERVER
// =======================================================
void sendToServer(double lat, double lng, float intensity, float ax, float ay, float az, int mpuIntensity, int sw420Intensity) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    err("No WiFi connection. Cannot send to server.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
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
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    ok("Server Response (" + String(httpResponseCode) + "): " + response);
  } else {
    err("HTTP Error: " + String(httpResponseCode));
  }
  
  http.end();
}

// =======================================================
//        SMS SENDER (Keep as backup)
// =======================================================
void sendSMS(double lat, double lng, float intensity) {
  String msg = "POTHOLE DETECTED!\n";
  msg += "Intensity: " + String(intensity,1) + "%\n";
  msg += "Lat: " + String(lat,6) + "\n";
  msg += "Lng: " + String(lng,6) + "\n";
  msg += "https://maps.google.com/?q=" + String(lat,6) + "," + String(lng,6);

  dbg("Sending SMS...");

  gsmSerial.println("AT");
  delay(300);
  dbg("AT → " + gsmSerial.readString());

  gsmSerial.println("AT+CMGF=1");
  delay(300);
  dbg("CMGF Response → " + gsmSerial.readString());

  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(PHONE);
  gsmSerial.println("\"");
  delay(500);

  gsmSerial.print(msg);
  gsmSerial.write(26); // CTRL+Z
  delay(2000);

  ok("SMS sent to phone.");
}

// =======================================================
//        GPS HEALTH CHECK
// =======================================================
bool checkGPS() {
  dbg("Checking GPS... waiting for data...");

  unsigned long start = millis();
  bool gotData = false;

  while (millis() - start < 5000) {
    while (gpsSerial.available()) {
      gps.encode(gpsSerial.read());
      gotData = true;
    }
  }

  if (!gotData) {
    err("GPS NOT DETECTED. No NMEA data.");
    return false;
  }

  ok("GPS Connected (NMEA received)");

  // Now check satellite fix
  dbg("Waiting for satellite lock...");

  unsigned long lockStart = millis();
  while (!gps.location.isValid() && millis() - lockStart < 10000) {
    while (gpsSerial.available()) gps.encode(gpsSerial.read());
  }

  if (!gps.location.isValid()) {
    err("GPS NOT LOCKED (No satellite fix)");
    return false;
  }

  ok("GPS FIX Acquired");
  dbg("Lat: " + String(gps.location.lat(),6) +
      "  Lng: " + String(gps.location.lng(),6));

  return true;
}

// =======================================================
//        SETUP
// =======================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  dbg("Starting RoadPulse ESP32 system...");

  // Setup WiFi first
  setupWiFi();

  // I2C
  Wire.begin(21,22);

  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

  // GSM
  gsmSerial.begin(9600, SERIAL_8N1, 25, 26);

  // Wake MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();

  // STEP 1 → Must confirm GPS is working
  while (!checkGPS()) {
    err("GPS FAILED. Retrying in 3 seconds...");
    delay(3000);
  }

  ok("GPS ready. Starting vibration detection...");
  delay(1000);
}

// =======================================================
//        LOOP
// =======================================================
void loop() {
  // Check WiFi status periodically
  checkWiFi();

  // ======== Read MPU6050 ========
  uint8_t buf[6];
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  for (int i=0; i<6; i++) buf[i] = Wire.read();

  int16_t axRaw = (buf[0]<<8)|buf[1];
  int16_t ayRaw = (buf[2]<<8)|buf[3];
  int16_t azRaw = (buf[4]<<8)|buf[5];

  float ax = axRaw / 16384.0;
  float ay = ayRaw / 16384.0;
  float az = azRaw / 16384.0;

  float diff = sqrt(pow(ax-prevAx,2)+pow(ay-prevAy,2)+pow(az-prevAz,2));

  prevAx = ax;
  prevAy = ay;
  prevAz = az;

  int mpuIntensity = map(constrain(diff * 100, 0, 100), 0, 100, 0, 100);

  // ======== Read SW420 ========
  int swRaw = analogRead(SW420_PIN);
  int swScaled = map(swRaw, 0, 4095, 0, 100);

  // ======== Combined vibration ========
  float intensity = MPU_WEIGHT*mpuIntensity + SW420_WEIGHT*swScaled;
  intensity = constrain(intensity, 0, 100);

  dbg("MPU=" + String(mpuIntensity) +
      "  SW420=" + String(swScaled) +
      "  Combined=" + String(intensity,1) + "%");

  // feed GPS reader
  while (gpsSerial.available()) gps.encode(gpsSerial.read());

  // ======== Trigger ========
  if (intensity >= ALERT_THRESHOLD) {
    ok("POTHOLE DETECTED! Intensity: " + String(intensity,1) + "%");

    double lat = gps.location.isValid() ? gps.location.lat() : 0.0;
    double lng = gps.location.isValid() ? gps.location.lng() : 0.0;

    if (!gps.location.isValid()) {
      err("GPS NOT READY AT MOMENT OF EVENT");
    }

    // Send to server (primary method)
    sendToServer(lat, lng, intensity, ax, ay, az, mpuIntensity, swScaled);

    // Send SMS as backup (optional)
    // sendSMS(lat, lng, intensity);

    delay(5000); // Prevent duplicate detections
  }

  delay(200);
}