'use client';

import { type Pothole, type UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface AnalyticsDashboardProps {
  potholes: Pothole[];
  role: UserRole;
}

export function AnalyticsDashboard({ potholes, role }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    const total = potholes.length;
    const completed = potholes.filter((p) => p.status === 'completed').length;
    const highSeverity = potholes.filter((p) => p.severityLevel === 'high').length;
    const avgVibration = potholes.length > 0 ? (potholes.reduce((sum, p) => sum + p.vibrationIntensity, 0) / potholes.length).toFixed(1) : 0;

    const last30Days = potholes.filter((p) => {
      const daysDiff = (new Date().getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const timelineData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = last30Days.filter((p) => {
        const pDate = new Date(p.timestamp);
        return pDate.toDateString() === date.toDateString();
      }).length;
      return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
    }).reverse();

    const severityData = [
      { name: 'High', value: potholes.filter((p) => p.severityLevel === 'high').length },
      { name: 'Medium', value: potholes.filter((p) => p.severityLevel === 'medium').length },
      { name: 'Low', value: potholes.filter((p) => p.severityLevel === 'low').length },
    ];

    const statusData = [
      { name: 'Reported', value: potholes.filter((p) => p.status === 'reported').length },
      { name: 'Verified', value: potholes.filter((p) => p.status === 'verified').length },
      { name: 'In Progress', value: potholes.filter((p) => p.status === 'in_progress').length },
      { name: 'Completed', value: potholes.filter((p) => p.status === 'completed').length },
    ];

    const topAreas = Array.from(new Set(potholes.map((p) => p.gps.address)))
      .map((address) => ({
        area: address,
        count: potholes.filter((p) => p.gps.address === address).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      completed,
      highSeverity,
      avgVibration,
      timelineData,
      severityData,
      statusData,
      topAreas,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
    };
  }, [potholes]);

  const colors = ['#ef4444', '#f97316', '#fbbf24', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Potholes</p>
              <p className="text-3xl font-bold text-foreground">{metrics.total}</p>
            </div>
            <Zap className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-foreground">{metrics.completionRate}%</p>
              <p className="text-xs text-success mt-1">{metrics.completed} completed</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">High Severity</p>
              <p className="text-3xl font-bold text-foreground">{metrics.highSeverity}</p>
              <p className="text-xs text-destructive mt-1">Urgent attention</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Avg Vibration</p>
              <p className="text-3xl font-bold text-foreground">{metrics.avgVibration}%</p>
              <p className="text-xs text-muted-foreground mt-1">Intensity level</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline Chart */}
        <Card className="p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Detections Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics.timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Severity Distribution */}
        <Card className="p-6 bg-card border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Breakdown */}
        {role !== 'public' && (
          <Card className="p-6 bg-card border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.2)' }} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Areas */}
        {role !== 'public' && (
          <Card className="p-6 bg-card border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Most Affected Areas</h3>
            <div className="space-y-3">
              {metrics.topAreas.map((area) => (
                <div key={area.area} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{area.area}</p>
                    <div className="w-full bg-secondary/50 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(area.count / metrics.topAreas[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-semibold text-primary">{area.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
