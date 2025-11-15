import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-config';
import { collection, addDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to write a simple test document
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({ 
      success: true, 
      testId: docRef.id,
      message: 'Firebase is working correctly!'
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      error: 'Firebase connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}