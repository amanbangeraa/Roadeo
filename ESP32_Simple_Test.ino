#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// === WIFI CONFIG ===
const char* WIFI_SSID = "Tech_Habba";
const char* WIFI_PASSWORD = "987654321";
const char* SERVER_URL = "https://roadeo-mj41o7x2z-amanbangeraas-projects.vercel.app/api/potholes";

// === PIN SETUP ===
#define MPU_ADDR 0x68

String DEVICE_ID = "ESP32-TEST-001"; // Test device identifier

// === VIBRATION CONFIG ===
#define ALERT_THRESHOLD 50  // Lowered threshold for easier testing
#define MAX_DIFF 1.0

float prevAx = 0, prevAy = 0, prevAz = 0;

// === WIFI STATUS ===
bool wifiConnected = false;
unsigned long lastWiFiCheck = 0;

// Test coordinates (you can change these to your location)
float TEST_LAT = 19.0760;  // Mumbai coordinates for testing
float TEST_LNG = 72.8777;

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
void sendToServer(float intensity, float ax, float ay, float az) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    err("No WiFi connection. Cannot send to server.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload with test coordinates
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = String(millis());
  doc["location"]["latitude"] = TEST_LAT + (random(-100, 100) / 10000.0); // Small random offset
  doc["location"]["longitude"] = TEST_LNG + (random(-100, 100) / 10000.0);
  doc["vibrationIntensity"] = intensity;
  doc["accelerometer"]["x"] = ax;
  doc["accelerometer"]["y"] = ay;
  doc["accelerometer"]["z"] = az;
  doc["sensorData"]["mpuIntensity"] = (int)intensity;
  doc["sensorData"]["sw420Intensity"] = 0; // Not using SW420 in this test
  doc["batteryLevel"] = 100; // Assume full battery for test
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  dbg("Sending test data to server: " + jsonString);
  
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
//        SETUP
// =======================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  dbg("Starting RoadPulse ESP32 TEST system...");
  dbg("This test version uses ONLY MPU6050 - no GPS/GSM required!");

  // Setup WiFi first
  setupWiFi();

  // I2C for MPU6050
  Wire.begin(21, 22);

  // Wake MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();

  ok("MPU6050 initialized. Ready for vibration testing!");
  ok("Shake or tap the ESP32 to trigger pothole detection.");
  ok("Check dashboard at: https://roadeo-mj41o7x2z-amanbangeraas-projects.vercel.app");
  
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
  for (int i = 0; i < 6; i++) buf[i] = Wire.read();

  int16_t axRaw = (buf[0] << 8) | buf[1];
  int16_t ayRaw = (buf[2] << 8) | buf[3];
  int16_t azRaw = (buf[4] << 8) | buf[5];

  float ax = axRaw / 16384.0;
  float ay = ayRaw / 16384.0;
  float az = azRaw / 16384.0;

  // Calculate movement difference
  float diff = sqrt(pow(ax - prevAx, 2) + pow(ay - prevAy, 2) + pow(az - prevAz, 2));

  prevAx = ax;
  prevAy = ay;
  prevAz = az;

  // Convert to intensity percentage
  float intensity = constrain(diff * 100, 0, 100);

  // Debug output every 2 seconds
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 2000) {
    dbg("Vibration Intensity: " + String(intensity, 1) + "% (Threshold: " + String(ALERT_THRESHOLD) + "%)");
    dbg("Accelerometer: X=" + String(ax, 2) + " Y=" + String(ay, 2) + " Z=" + String(az, 2));
    lastDebug = millis();
  }

  // ======== Trigger Detection ========
  if (intensity >= ALERT_THRESHOLD) {
    ok("🚨 POTHOLE DETECTED! Intensity: " + String(intensity, 1) + "%");
    ok("Sending data to dashboard...");

    // Send to server with test coordinates
    sendToServer(intensity, ax, ay, az);

    delay(3000); // Prevent duplicate detections for 3 seconds
  }

  delay(100); // Fast sampling for responsive detection
}