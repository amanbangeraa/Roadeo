# 🔐 Firebase Security Rules Setup Guide

## Quick Setup (For Testing)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `roadeo-f55c8`
3. **Navigate to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the existing rules with:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // For testing purposes - allows read/write to all documents
    // IMPORTANT: Change this to more restrictive rules in production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. **Click "Publish"**

## 🧪 Test the Connection

After updating the rules, run:
```bash
node test-firebase.js
```

You should see:
- ✅ Firebase app initialized successfully
- ✅ Firestore connected successfully  
- ✅ Test document written with ID: [document-id]
- ✅ Successfully read documents from Firestore
- 🎉 Firebase connection test completed successfully!

## 🚨 Important Security Note

The rules above allow **anyone** to read/write your database. This is only for testing!

For production, use the secure rules provided in `firestore.rules` that include:
- Authentication requirements
- Role-based permissions
- Data validation
- Proper access control

## 🛠️ Alternative: Firebase CLI Setup

If you prefer using Firebase CLI:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

## 🔄 Next Steps

1. **Update security rules** (as described above)
2. **Test Firebase connection** with `node test-firebase.js`
3. **Update API routes** to use Firebase instead of in-memory storage
4. **Add authentication** for production security
5. **Deploy updated application** to Vercel

## 🎯 Expected Test Results

After updating the security rules, your test should show:

```
🔥 Firebase Connection Test Starting...

📋 Checking environment variables...
✅ NEXT_PUBLIC_FIREBASE_API_KEY: AIzaSyBCZsKvlieG8omV...
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: roadeo-f55c8.firebas...
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID: roadeo-f55c8...
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: roadeo-f55c8.firebas...
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 625395951614...
✅ NEXT_PUBLIC_FIREBASE_APP_ID: 1:625395951614:web:d...

🔧 Initializing Firebase app...
✅ Firebase app initialized successfully
📊 Connecting to Firestore...
✅ Firestore connected successfully
✍️  Testing write operation...
✅ Test document written with ID: ABC123xyz
📖 Testing read operation...
✅ Successfully read 1 documents from Firestore
📄 Sample document:
{
  "id": "ABC123xyz",
  "deviceId": "TEST_DEVICE_001",
  "timestamp": "2024-11-15T19:51:19.875Z",
  "vibrationIntensity": 75.5,
  "severityLevel": "moderate",
  "status": "active",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}

🎉 Firebase connection test completed successfully!
🚀 Your Firebase integration is ready to use.
```