# Twilio SMS Integration Setup Guide

This guide will help you set up SMS-based data transmission from your ESP32 device to your backend through Twilio webhooks.

## Architecture Overview

```
ESP32 → GSM Module → SMS → Twilio → Webhook → Your Backend → Firebase
```

1. **ESP32 + GSM Module**: Sends structured SMS messages (no data plan needed)
2. **Twilio**: Receives SMS and forwards to your webhook via HTTP POST
3. **Your Backend**: Parses SMS data and stores in Firebase
4. **Dashboard**: Displays real-time pothole data

## Step 1: Set Up Twilio Account

### 1.1 Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

### 1.2 Get a Twilio Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number with SMS capabilities
3. Purchase the number (costs ~$1/month)
4. Note down your Twilio phone number (e.g., `+1234567890`)

### 1.3 Get Account Credentials
1. Go to **Console Dashboard**
2. Note down:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (from step 1.2)

## Step 2: Configure Your ESP32

### 2.1 Update ESP32 Code
Replace the phone number in your ESP32 code:

```cpp
// === TWILIO PHONE NUMBER ===
String TWILIO_PHONE = "+1234567890"; // Replace with your Twilio number
```

### 2.2 Verify GSM Module
Make sure your GSM module is properly connected:
- **ESP32 Pin 25** → GSM RX
- **ESP32 Pin 26** → GSM TX  
- **Power and Ground** properly connected
- **SIM card** inserted (SMS plan required, no data plan needed)

## Step 3: Configure Webhook URL

### 3.1 Deploy Your Application
First, deploy your application to get a live URL:

```bash
# If using Vercel
npm run build
vercel --prod

# Note your deployment URL (e.g., https://your-app.vercel.app)
```

### 3.2 Set Up Twilio Webhook
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active numbers**
2. Click on your purchased number
3. In **Messaging** section, set:
   - **A message comes in**: Webhook
   - **URL**: `https://your-app.vercel.app/api/twilio-webhook`
   - **HTTP Method**: POST
4. Save the configuration

## Step 4: Test the Integration

### 4.1 Test Webhook Endpoint
Test if your webhook is accessible:

```bash
curl -X GET https://your-app.vercel.app/api/twilio-webhook
```

Expected response:
```json
{
  "status": "RoadPulse Twilio Webhook is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 4.2 Test SMS Format
Send a test SMS to your Twilio number with this format:
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076000|LNG:72.877700|INT:85.0|TIME:123456|SATS:8|TYPE:POTHOLE
```

### 4.3 Check Logs
Monitor your application logs to see if the webhook receives and processes the SMS:

```bash
# Vercel logs
vercel logs --follow

# Or check Firebase console for new pothole records
```

## Step 5: Monitor and Debug

### 5.1 Twilio Console Monitoring
1. Go to **Monitor** → **Logs** → **Messages**
2. Check message delivery status
3. Look for webhook errors

### 5.2 Common Issues

**Issue: Webhook not receiving messages**
- Check webhook URL is correct
- Verify application is deployed
- Check Twilio number configuration

**Issue: SMS parsing errors**
- Verify ESP32 sends correct format
- Check webhook logs for parsing errors
- Validate SMS structure

**Issue: Firebase storage errors**
- Check Firebase configuration
- Verify service account permissions
- Monitor console for error logs

### 5.3 ESP32 Debug Output
Monitor ESP32 serial output:
```
[ OK ] Structured SMS sent to Twilio: +1234567890
[DEBUG] SMS Details: ROADPULSE|DEV:ESP32-BUS-001|...
```

## Step 6: Production Considerations

### 6.1 Security
- Add authentication to webhook if needed
- Validate Twilio request signatures
- Rate limit webhook endpoint

### 6.2 Cost Optimization
- SMS costs ~$0.0075 per message
- Send heartbeats less frequently (every 5-10 minutes)
- Only send pothole alerts, not all sensor readings

### 6.3 Scaling
- Use Twilio phone number pools for multiple devices
- Implement device ID routing
- Add message queuing for high volume

## Example SMS Messages

### Pothole Detection
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076543|LNG:72.877789|INT:85.0|TIME:1234567890|SATS:8|TYPE:POTHOLE
```

### Heartbeat
```
ROADPULSE|DEV:ESP32-BUS-001|LAT:19.076543|LNG:72.877789|INT:0|TIME:1234567890|SATS:6|TYPE:HEARTBEAT
```

## Testing Checklist

- [ ] Twilio account created and verified
- [ ] Phone number purchased and configured
- [ ] Webhook URL set in Twilio console
- [ ] Application deployed with webhook endpoint
- [ ] ESP32 code updated with Twilio number
- [ ] GSM module properly connected
- [ ] SIM card with SMS plan inserted
- [ ] Test SMS sent and received
- [ ] Firebase records created successfully
- [ ] Dashboard shows new pothole data

## Support

If you encounter issues:
1. Check Twilio message logs
2. Monitor application logs
3. Verify SMS format matches expected structure
4. Test webhook endpoint directly
5. Check Firebase console for data

---

**Note**: This setup requires an active SIM card with SMS capabilities but does NOT need a data plan. All cloud communication happens through Twilio's infrastructure.