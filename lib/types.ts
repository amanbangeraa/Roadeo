import type { Pothole, Severity, Status, UserRole } from './mock-data';

export type { Pothole, Severity, Status, UserRole };

export interface FilterState {
  severity: Severity | 'all';
  status: Status | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
  deviceId: string | 'all';
  searchLocation: string;
}
