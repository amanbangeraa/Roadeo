# SMS-Based Pothole Detection System - Implementation Summary

## 🎯 What We've Built

A complete SMS-based pothole detection system that works **without WiFi or mobile data**. Your ESP32 sends structured SMS messages through a GSM module to Twilio, which forwards the data to your backend via webhooks.

## 📁 Files Modified/Created

### 1. ESP32 Code Changes
**File:** `ESP32_Complete_System.ino`

**Key Changes:**
- Updated SMS format for structured data parsing
- Changed from WiFi-first to SMS-first communication
- Added heartbeat SMS functionality every 5 minutes
- Structured message format: `ROADPULSE|DEV:device|LAT:lat|LNG:lng|INT:intensity|TIME:time|SATS:sats|TYPE:type`

### 2. Backend Webhook
**File:** `app/api/twilio-webhook/route.ts` *(NEW)*

**Features:**
- Receives SMS data from Twilio webhooks
- Parses structured SMS messages
- Validates data integrity
- Stores pothole data in Firebase
- Handles both pothole alerts and device heartbeats

### 3. Firebase Service Enhancement
**File:** `lib/firebase-service.ts`

**Added:**
- `addPotholeRecord()` function for SMS data
- SMS source tracking in metadata
- Device heartbeat updates via SMS

### 4. Documentation & Testing
**Files Created:**
- `TWILIO_SMS_SETUP_GUIDE.md` - Complete setup instructions
- `scripts/test-webhook.js` - Testing tool for webhook
- Updated `package.json` with test scripts

## 🔄 System Flow

```
┌─────────────┐    SMS    ┌──────────┐   HTTP   ┌─────────────┐   Store   ┌──────────┐
│   ESP32     │ ────────▶ │  Twilio  │ ───────▶ │   Webhook   │ ────────▶ │ Firebase │
│ + GSM Module│           │  Cloud   │          │  /api/...   │           │Database │
└─────────────┘           └──────────┘          └─────────────┘           └──────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │  Dashboard  │
                                                │ (Real-time) │
                                                └─────────────┘
```

## 📋 Setup Checklist

### ESP32 Setup
- [ ] Update `TWILIO_PHONE` with your Twilio number
- [ ] Ensure GSM module is connected (pins 25, 26)
- [ ] Insert SIM card with SMS plan (no data needed)
- [ ] Upload modified code to ESP32

### Twilio Setup
- [ ] Create Twilio account
- [ ] Purchase phone number with SMS capability
- [ ] Configure webhook URL: `https://your-app.vercel.app/api/twilio-webhook`
- [ ] Set webhook method to POST

### Backend Setup
- [ ] Deploy application to get live URL
- [ ] Verify webhook endpoint is accessible
- [ ] Test with provided test script
- [ ] Monitor logs for incoming messages

## 🧪 Testing Your Setup

### 1. Test Webhook Health
```bash
npm run test:webhook:health
```

### 2. Test Pothole Message Processing
```bash
npm run test:webhook:pothole
```

### 3. Test Complete Integration
```bash
# Run all tests
npm run test:webhook

# Or test with custom URL
WEBHOOK_URL=https://your-app.vercel.app/api/twilio-webhook npm run test:webhook
```

### 4. Monitor Real ESP32
Send a test SMS from your phone to your Twilio number:
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076543|LNG:72.877789|INT:85.0|TIME:1234567890|SATS:8|TYPE:POTHOLE
```

## 📊 Message Formats

### Pothole Detection
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076543|LNG:72.877789|INT:85.0|TIME:1234567890|SATS:8|TYPE:POTHOLE
```

### Device Heartbeat
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076543|LNG:72.877789|INT:0|TIME:1234567890|SATS:6|TYPE:HEARTBEAT
```

## 💰 Cost Analysis

### SMS Costs (Twilio)
- **Incoming SMS**: ~$0.0075 per message
- **Phone Number**: ~$1.00 per month
- **Estimated Monthly Cost** (100 potholes + 8640 heartbeats): ~$65

### Alternative: Reduce Heartbeats
- Send heartbeats every 10 minutes instead of 5
- **Reduced Monthly Cost**: ~$33

## 🔧 Configuration Options

### ESP32 Heartbeat Frequency
In `ESP32_Complete_System.ino`, change:
```cpp
// Current: every 5 minutes (300000ms)
if (millis() - lastHeartbeat > 300000) {

// Change to 10 minutes to reduce costs
if (millis() - lastHeartbeat > 600000) {
```

### SMS Threshold Adjustment
```cpp
#define ALERT_THRESHOLD 80  // Reduce to 60 for more sensitive detection
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving SMS**
   - Check Twilio webhook URL configuration
   - Verify application is deployed and accessible
   - Test webhook endpoint directly

2. **SMS parsing errors**
   - Check ESP32 serial monitor for sent message format
   - Verify message structure matches expected format
   - Monitor webhook logs for parsing errors

3. **Firebase storage errors**
   - Check Firebase configuration
   - Verify service account permissions
   - Monitor Firebase console for quota limits

### Debug Commands
```bash
# Check webhook health
curl https://your-app.vercel.app/api/twilio-webhook

# Monitor Vercel logs
vercel logs --follow

# Test specific message type
node scripts/test-webhook.js pothole
```

## 🎉 Success Indicators

When everything works correctly, you should see:

1. **ESP32 Serial Output:**
   ```
   [ OK ] Structured SMS sent to Twilio: +1234567890
   [DEBUG] Sending structured SMS to Twilio: ROADPULSE|DEV:...
   ```

2. **Twilio Console:**
   - Messages appear in logs with "delivered" status
   - Webhook calls show successful responses (200 status)

3. **Application Logs:**
   ```
   ✅ Parsed SMS data: { deviceId: 'ESP32-BUS-001', ... }
   ✅ Pothole record created: { id: 'abc123', ... }
   ```

4. **Firebase Console:**
   - New documents in `potholes` collection
   - Real-time updates in dashboard

5. **Dashboard:**
   - New pothole markers appear on map
   - Device status shows as "online"
   - Analytics update with new detections

## 📚 Next Steps

1. **Deploy and test** the complete system
2. **Monitor costs** and adjust heartbeat frequency if needed
3. **Add more devices** by updating device IDs
4. **Implement alerts** for high-severity potholes
5. **Add SMS reply functionality** for status updates

---

**Your SMS-based pothole detection system is now ready for deployment!** 🚀

The system works entirely through SMS - no WiFi or mobile data required. Simply deploy your application, configure Twilio, and start detecting potholes via SMS.