export enum LogCategory {
  AUTH = 'AUTH',
  PAYMENT = 'PAYMENT',
  REGISTRATION = 'REGISTRATION',
  EVENT = 'EVENT',
  ADMIN = 'ADMIN',
  MAILER = 'MAILER',
  USER = 'USER',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service?: string;
  category?: string;
  message: string;
  userId?: string;
  anweshaId?: string;
  orderId?: string;
  eventId?: string;
  statusCode?: number;
  durationMs?: number;
  error?: any;
  raw: any;
}

export interface LogsResponse {
  success: boolean;
  count: number;
  nextToken?: string;
  logs: LogEntry[];
}
