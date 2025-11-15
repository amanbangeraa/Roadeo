'use client';

import { type Pothole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ReportsPanelProps {
  potholes: Pothole[];
}

export function ReportsPanel({ potholes }: ReportsPanelProps) {
  const [reportType, setReportType] = useState('summary');

  const exportToCSV = () => {
    const headers = ['ID', 'Location', 'Severity', 'Status', 'Vibration', 'Device', 'Date'];
    const rows = potholes.map((p) => [
      p.id,
      p.gps.address,
      p.severityLevel,
      p.status,
      p.vibrationIntensity,
      p.deviceId,
      new Date(p.timestamp).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadpulse-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-6">Generate Reports</h3>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['summary', 'detailed', 'scheduled'].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    reportType === type
                      ? 'bg-primary/20 border-primary'
                      : 'bg-secondary/30 border-border/50 hover:bg-secondary/50'
                  }`}
                >
                  <p className="font-medium text-foreground capitalize">{type} Report</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type === 'summary' && 'Overview of key metrics'}
                    {type === 'detailed' && 'Complete pothole details'}
                    {type === 'scheduled' && 'Weekly/monthly emails'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Date Range</label>
            <div className="flex gap-3">
              <input
                type="date"
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
              />
              <input
                type="date"
                className="px-4 py-2 bg-input border border-border rounded-lg text-foreground text-sm"
              />
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Export Format</label>
            <div className="flex gap-3">
              <Button onClick={exportToCSV} className="flex gap-2 bg-primary hover:bg-primary/90">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="flex gap-2 border-border/50">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <h4 className="font-medium text-foreground mb-3">Report Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{potholes.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Potholes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{potholes.filter((p) => p.severityLevel === 'high').length}</p>
                <p className="text-xs text-muted-foreground mt-1">High Severity</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{potholes.filter((p) => p.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {potholes.length > 0 ? ((potholes.filter((p) => p.status === 'completed').length / potholes.length) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completion</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
