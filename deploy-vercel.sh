#!/bin/bash

# Vercel Environment Variables Setup Script for RoadPulse Firebase Integration
echo "🚀 Setting up Vercel Environment Variables for Firebase Integration"

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

echo "📝 Adding Firebase environment variables to Vercel..."

# Add all Firebase environment variables
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production <<< "AIzaSyBxGpbNaOu80a8Co3fQlgyzzpwRtMkrEoI"
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "AIzaSyBCZsKvlieG8omVv6qIOiAe9tYwkQ5uwRE"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "roadeo-f55c8.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "roadeo-f55c8"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "roadeo-f55c8.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "625395951614"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "1:625395951614:web:d821143db803da745a82af"
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production <<< "G-W4G7G74SL3"

echo "✅ All environment variables added!"
echo "🚀 Now deploying to production..."

# Deploy to production
vercel --prod

echo "🎉 Deployment complete!"
echo "📊 Your Firebase-powered RoadPulse is now live!"