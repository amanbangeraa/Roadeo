# 🚀 Vercel Production Deployment Guide

## 📋 Step 1: Add Environment Variables to Vercel

Go to your Vercel dashboard: https://vercel.com/dashboard

1. **Navigate to your project**: `Roadeo` 
2. **Click "Settings" tab**
3. **Click "Environment Variables" in sidebar**
4. **Add each variable below:**

### 🔥 Firebase Configuration Variables

Add these **EXACTLY** as shown (copy from your .env.local file):

```bash
# Variable Name: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
# Value: AIzaSyBxGpbNaOu80a8Co3fQlgyzzpwRtMkrEoI

# Variable Name: NEXT_PUBLIC_FIREBASE_API_KEY  
# Value: AIzaSyBCZsKvlieG8omVv6qIOiAe9tYwkQ5uwRE

# Variable Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# Value: roadeo-f55c8.firebaseapp.com

# Variable Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Value: roadeo-f55c8

# Variable Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# Value: roadeo-f55c8.firebasestorage.app

# Variable Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# Value: 625395951614

# Variable Name: NEXT_PUBLIC_FIREBASE_APP_ID
# Value: 1:625395951614:web:d821143db803da745a82af

# Variable Name: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
# Value: G-W4G7G74SL3
```

### 📝 How to Add Each Variable:

1. Click **"Add New"** button
2. **Name**: Enter the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. **Value**: Enter the corresponding value
4. **Environment**: Select **"Production", "Preview", and "Development"** (all three)
5. Click **"Save"**
6. Repeat for all 8 variables

## 🔄 Step 2: Redeploy to Apply Changes

After adding all environment variables:

1. Go to **"Deployments"** tab
2. Find the latest deployment 
3. Click the **"⋯" menu** next to it
4. Click **"Redeploy"** 
5. ✅ Check **"Use existing Build Cache"**
6. Click **"Redeploy"**

## 🧪 Step 3: Test Production Deployment

Once redeployment completes:

### Test the API endpoints:
```bash
# GET potholes from Firebase
curl https://roadeo-silk.vercel.app/api/potholes

# POST new pothole data (simulate ESP32)
curl -X POST https://roadeo-silk.vercel.app/api/potholes \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_PROD_TEST",
    "timestamp": "2024-11-16T01:00:00.000Z", 
    "location": {"latitude": 12.9716, "longitude": 77.5946},
    "vibrationIntensity": 85.2,
    "accelerometer": {"x": 2.1, "y": 1.8, "z": 9.8}
  }'
```

### Expected Results:
- ✅ **GET**: Returns `{"potholes": [...], "count": X}` from Firebase
- ✅ **POST**: Returns `{"success": true, "potholeId": "firebase_doc_id"}`
- ✅ **Dashboard**: Shows real-time data at your production URL

## 🔍 Step 4: Verify Firebase Integration

1. **Open production URL**: https://roadeo-silk.vercel.app
2. **Check Firebase Console**: https://console.firebase.google.com/project/roadeo-f55c8/firestore
3. **Send test data** using ESP32 or curl commands above
4. **Verify data appears** in both Firebase console and your dashboard

## ✅ Success Indicators

Your deployment is successful when:

- 🌐 **Production URL loads** without errors
- 🗺️ **Google Maps displays** correctly  
- 🔥 **Firebase data loads** in dashboard
- 📡 **API endpoints respond** with Firebase data
- 🔌 **ESP32 can send data** to production API
- ☁️ **Data persists** in Firebase cloud database

## 🚨 Troubleshooting

If deployment fails:
- ✅ **Check all 8 environment variables** are added correctly
- ✅ **Verify Firebase security rules** allow read/write access
- ✅ **Check Vercel function logs** for any errors
- ✅ **Test Firebase connection** from local development first

## 🎯 Production URLs

- **Dashboard**: https://roadeo-silk.vercel.app
- **API Endpoint**: https://roadeo-silk.vercel.app/api/potholes
- **Firebase Console**: https://console.firebase.google.com/project/roadeo-f55c8

Once complete, your RoadPulse system will be:
- 🚀 **Production-ready** with Firebase cloud backend
- 📊 **Scalable** to thousands of ESP32 devices
- ☁️ **Persistent** with automatic cloud backups
- 🔄 **Real-time** updates across all users