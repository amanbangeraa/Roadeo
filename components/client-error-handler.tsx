'use client';

import { useEffect } from 'react';

export function ClientErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check if it's a Firebase configuration error
      if (event.reason?.message?.includes('Firebase configuration')) {
        console.error('Firebase configuration issue detected');
        // You could show a user-friendly message here
      }
      
      // Prevent the default browser behavior
      event.preventDefault();
    };

    // Handle other JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('JavaScript error:', event.error);
      
      // Check for common deployment issues
      if (event.error?.message?.includes('hydration')) {
        console.error('Hydration mismatch detected');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}