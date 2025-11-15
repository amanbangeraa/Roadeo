'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';

interface MapUpdateNotificationProps {
  newItemsCount: number;
  onViewNow: () => void;
  onDismiss: () => void;
  className?: string;
}

export function MapUpdateNotification({ 
  newItemsCount, 
  onViewNow, 
  onDismiss, 
  className = '' 
}: MapUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newItemsCount > 0) {
      setIsVisible(true);
    }
  }, [newItemsCount]);

  if (!isVisible || newItemsCount === 0) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  const handleViewNow = () => {
    setIsVisible(false);
    onViewNow();
  };

  return (
    <div className={`fixed top-20 right-6 z-50 transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${className}`}>
      <div className="bg-blue-50 border-l-4 border-blue-500 shadow-lg rounded-lg p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800">
                New Data Available
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {newItemsCount} new pothole{newItemsCount > 1 ? 's' : ''} detected nearby
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleViewNow}
                  className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Update Map
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-blue-600 text-xs px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Alternative minimal toast notification
export function MapUpdateToast({ 
  newItemsCount, 
  onViewNow, 
  onDismiss 
}: MapUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newItemsCount > 0) {
      setIsVisible(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [newItemsCount, onDismiss]);

  if (!isVisible || newItemsCount === 0) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3 flex items-center space-x-3 max-w-xs">
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 font-medium">
            {newItemsCount} new update{newItemsCount > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onViewNow();
          }}
          className="text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          View
        </button>
      </div>
    </div>
  );
}