'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    severity: 'low' | 'medium' | 'high';
    onClick?: () => void;
  }>;
  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
  showUserLocation?: boolean;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center,
  zoom,
  markers = [],
  onMapLoad,
  className = 'w-full h-96',
  showUserLocation = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Severity color mapping
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444'; // red
      case 'medium': return '#f97316'; // orange
      case 'low': return '#fbbf24'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Script exists, wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsScriptLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Error loading Google Maps script');
    };

    document.head.appendChild(script);
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current) {
      console.log('Map not ready:', { isScriptLoaded, hasMapRef: !!mapRef.current });
      return;
    }

    console.log('Initializing Google Maps...');
    
    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      console.log('Google Maps initialized successfully');
      setMap(mapInstance);
      setIsLoaded(true);
      onMapLoad?.(mapInstance);

      // Add user location if requested
      if (showUserLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // Add user location marker
            new window.google.maps.Marker({
              position: userLocation,
              map: mapInstance,
              title: 'Your Location',
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 10,
              },
            });
          },
          (error) => {
            console.log('Geolocation error:', error.message);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [isScriptLoaded, center.lat, center.lng, zoom, onMapLoad, showUserLocation]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !isLoaded || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: getSeverityColor(markerData.severity),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${markerData.title}</h3>
            <p style="margin: 0; font-size: 12px; color: #666; text-transform: capitalize;">Severity: ${markerData.severity}</p>
          </div>
        `,
      });

      // Add click listeners
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (markerData.onClick) {
          markerData.onClick();
        }
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if there are markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
      
      // Set a maximum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) map.setZoom(15);
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [map, markers, isLoaded]);

  return (
    <div className={className}>
      {(!isScriptLoaded || !isLoaded) && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              {!isScriptLoaded ? 'Loading Google Maps...' : 'Initializing map...'}
            </p>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`${className} ${(!isScriptLoaded || !isLoaded) ? 'hidden' : ''}`} />
    </div>
  );
};

export default GoogleMap;