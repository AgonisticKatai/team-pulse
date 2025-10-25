// Shared types and domain models

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  environment?: string;
}

// User types
export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Match types (to be expanded)
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: Date;
  status: 'scheduled' | 'in-progress' | 'finished';
}

// Export all types
export * from './types';
