'use client';

import { type Pothole } from '@/lib/mock-data';
import { type FilterState } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import GoogleMap from './google-map';

interface MapViewProps {
  potholes: Pothole[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  lastUpdateTime?: number;
}

export function MapView({ potholes, filters, onFilterChange, lastUpdateTime }: MapViewProps) {
  const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);
  
  const severityColors = {
    low: '#fbbf24',
    medium: '#f97316',
    high: '#ef4444',
  };

  // Calculate center point from all potholes
  const mapCenter = useMemo(() => {
    if (potholes.length === 0) {
      // Default to Chennai if no potholes
      return { lat: 13.0827, lng: 80.2707 };
    }
    
    const avgLat = potholes.reduce((sum, p) => sum + p.gps.latitude, 0) / potholes.length;
    const avgLng = potholes.reduce((sum, p) => sum + p.gps.longitude, 0) / potholes.length;
    return { lat: avgLat, lng: avgLng };
  }, [potholes]);

  // Convert potholes to markers
  const markers = useMemo(() => {
    return potholes.map((pothole) => ({
      position: { lat: pothole.gps.latitude, lng: pothole.gps.longitude },
      title: `${pothole.id} - ${pothole.gps.address}`,
      severity: pothole.severityLevel,
      onClick: () => setSelectedPothole(pothole),
    }));
  }, [potholes]);

  const clusters = useMemo(() => {
    const grouped: Record<string, Pothole[]> = {};
    potholes.forEach((p) => {
      const key = `${p.gps.address}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    return grouped;
  }, [potholes]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 bg-card border-border/50">
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.severity}
            onChange={(e) =>
              onFilterChange({ ...filters, severity: e.target.value as FilterState['severity'] })
            }
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as FilterState['status'] })
            }
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
          >
            <option value="all">All Status</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) =>
              onFilterChange({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })
            }
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Google Maps */}
        <div className="lg:col-span-2">
          <Card className="p-4 bg-card border-border/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Interactive Map</h3>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.high }} />
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.medium }} />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.low }} />
                    <span>Low</span>
                  </div>
                </div>
              </div>
              
              <GoogleMap
                center={mapCenter}
                zoom={12}
                markers={markers}
                className="w-full h-96 rounded-lg"
                showUserLocation={true}
              />
            </div>
          </Card>
        </div>

        {/* Location Details Sidebar */}
        <div className="space-y-4">
          {/* Selected Pothole Details */}
          {selectedPothole && (
            <Card className="p-4 bg-card border-border/50">
              <h4 className="font-semibold text-sm mb-3">Selected Pothole</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">ID:</span> {selectedPothole.id}</p>
                <p><span className="font-medium">Location:</span> {selectedPothole.gps.address}</p>
                <p><span className="font-medium">Severity:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    selectedPothole.severityLevel === 'high' ? 'bg-red-100 text-red-800' :
                    selectedPothole.severityLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedPothole.severityLevel.charAt(0).toUpperCase() + selectedPothole.severityLevel.slice(1)}
                  </span>
                </p>
                <p><span className="font-medium">Status:</span> 
                  <span className="ml-2 capitalize">{selectedPothole.status.replace(/_/g, ' ')}</span>
                </p>
                <p><span className="font-medium">Vibration:</span> {selectedPothole.vibrationIntensity.toFixed(1)}%</p>
                <p><span className="font-medium">Device:</span> {selectedPothole.deviceId}</p>
                <p><span className="font-medium">Reported:</span> {new Date(selectedPothole.timestamp).toLocaleDateString()}</p>
              </div>
            </Card>
          )}

          {/* Area Clusters */}
          <Card className="p-4 bg-card border-border/50">
            <h4 className="font-semibold text-sm mb-3">Areas ({Object.keys(clusters).length})</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {Object.entries(clusters).map(([location, items]) => (
                <div
                  key={location}
                  className="p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPothole(items[0])}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-xs text-foreground truncate">{location}</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {items.length} pothole{items.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {items.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: severityColors[item.severityLevel as keyof typeof severityColors],
                            }}
                          />
                        ))}
                        {items.length > 8 && (
                          <span className="text-xs text-muted-foreground ml-1">+{items.length - 8}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
