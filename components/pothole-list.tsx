'use client';

import { type Pothole, type UserRole } from '@/lib/types';
import { type FilterState } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Eye } from 'lucide-react';
import { useState } from 'react';

interface PotholeListProps {
  potholes: Pothole[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  role: UserRole;
}

export function PotholeList({ potholes, filters, onFilterChange, role }: PotholeListProps) {
  const [sortBy, setSortBy] = useState('timestamp');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const sorted = [...potholes].sort((a, b) => {
    if (sortBy === 'timestamp') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (sortBy === 'severity') {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severityLevel] - severityOrder[a.severityLevel];
    }
    if (sortBy === 'vibration') return b.vibrationIntensity - a.vibrationIntensity;
    return 0;
  });

  const paginatedPotholes = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-warning/20 text-warning',
      medium: 'bg-orange-500/20 text-orange-400',
      high: 'bg-destructive/20 text-destructive',
    };
    return colors[severity as keyof typeof colors];
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      reported: 'bg-blue-500/20 text-blue-400',
      verified: 'bg-primary/20 text-primary',
      assigned: 'bg-purple-500/20 text-purple-400',
      in_progress: 'bg-orange-500/20 text-orange-400',
      completed: 'bg-success/20 text-success',
    };
    return colors[status as keyof typeof colors] || 'bg-muted/20 text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 bg-card border-border/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['today', 'week', 'month', 'all'].map((range) => (
              <Button
                key={range}
                variant={filters.dateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ ...filters, dateRange: range as FilterState['dateRange'] })}
                className={filters.dateRange === range ? 'bg-primary text-primary-foreground border-primary' : ''}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
              </Button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
          >
            <option value="timestamp">Latest First</option>
            <option value="severity">Highest Severity</option>
            <option value="vibration">Highest Vibration</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden bg-card border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-foreground">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Location</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Severity</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Vibration</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Device</th>
                {role === 'municipal_agent' && <th className="px-6 py-3 text-left font-semibold text-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedPotholes.map((pothole) => (
                <tr
                  key={pothole.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-primary">{pothole.id}</td>
                  <td className="px-6 py-4 text-sm">{pothole.gps.address}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityBadge(pothole.severityLevel)}`}>
                      {pothole.severityLevel.charAt(0).toUpperCase() + pothole.severityLevel.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(pothole.status)}`}>
                      {pothole.status.replace(/_/g, ' ').charAt(0).toUpperCase() + pothole.status.replace(/_/g, ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{pothole.vibrationIntensity.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{pothole.deviceId}</td>
                  {role === 'municipal_agent' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-secondary/20">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sorted.length)} of{' '}
            {sorted.length} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              {currentPage} / {totalPages}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
