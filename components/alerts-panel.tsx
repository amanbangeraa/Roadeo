'use client';

import { type Pothole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';

interface AlertsPanelProps {
  potholes: Pothole[];
}

export function AlertsPanel({ potholes }: AlertsPanelProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const alerts = useMemo(() => {
    const now = new Date();
    const newAlerts: Array<{ id: string; type: string; title: string; description: string; severity: string; time: string }> = [];

    // High severity potholes
    potholes
      .filter((p) => p.severityLevel === 'high' && !dismissedAlerts.includes(`high-${p.id}`))
      .forEach((p) => {
        newAlerts.push({
          id: `high-${p.id}`,
          type: 'high-severity',
          title: 'High Severity Pothole Detected',
          description: `Location: ${p.gps.address}. Vibration: ${p.vibrationIntensity}%`,
          severity: 'critical',
          time: new Date(p.timestamp).toLocaleTimeString(),
        });
      });

    // Overdue repairs
    potholes
      .filter((p) => p.status === 'in_progress' && !dismissedAlerts.includes(`overdue-${p.id}`))
      .forEach((p) => {
        const daysPassed = Math.floor((now.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60 * 24));
        if (daysPassed > 5) {
          newAlerts.push({
            id: `overdue-${p.id}`,
            type: 'overdue',
            title: 'Repair Overdue',
            description: `${p.gps.address} - ${daysPassed} days in progress`,
            severity: 'warning',
            time: `${daysPassed} days ago`,
          });
        }
      });

    return newAlerts.slice(0, 10);
  }, [potholes, dismissedAlerts]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Alerts ({alerts.length})</h3>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border flex items-start justify-between ${
                  alert.severity === 'critical'
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-warning/10 border-warning/30'
                }`}
              >
                <div className="flex gap-3 flex-1">
                  {alert.severity === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
                  ) : (
                    <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <p className={`font-medium ${alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}`}>
                      {alert.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
