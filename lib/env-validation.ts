/**
 * Environment validation utility for deployment debugging
 */

export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const optionalVars = [
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PROJECT_ID',
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  const present = [...requiredVars, ...optionalVars].filter(key => !!process.env[key]);

  const report = {
    isValid: missing.length === 0,
    missing,
    present: present.length,
    total: requiredVars.length + optionalVars.length,
    details: {
      firebase: {
        configured: requiredVars.every(key => key.includes('FIREBASE') ? !!process.env[key] : true),
        missingFirebaseVars: missing.filter(key => key.includes('FIREBASE')),
      },
      twilio: {
        configured: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
      },
      maps: {
        configured: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      }
    }
  };

  return report;
}

export function logEnvironmentStatus() {
  if (typeof window !== 'undefined') {
    const report = validateEnvironment();
    
    console.group('🔧 Environment Configuration Status');
    console.log(`✅ Valid: ${report.isValid}`);
    console.log(`📊 Variables: ${report.present}/${report.total} configured`);
    
    if (report.missing.length > 0) {
      console.warn('❌ Missing required variables:', report.missing);
    }
    
    console.log('🔥 Firebase:', report.details.firebase.configured ? '✅' : '❌');
    console.log('📱 Twilio SMS:', report.details.twilio.configured ? '✅' : '❌');
    console.log('🗺️ Google Maps:', report.details.maps.configured ? '✅' : '❌');
    
    console.groupEnd();
    
    return report;
  }
}

// Auto-run validation on client side
if (typeof window !== 'undefined') {
  logEnvironmentStatus();
}