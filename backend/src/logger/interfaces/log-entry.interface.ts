import { LogLevel } from '@prisma/client';

export type ServiceName =
  | 'disbursement'
  | 'repayment'
  | 'payment'
  | 'loan'
  | 'account'
  | 'transaction'
  | 'rollback'
  | 'audit'
  | 'system';

export interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string;
}

export interface LogMetadata {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string; // ISO8601
  level: LogLevel;
  service: ServiceName;
  operation: string;
  transactionId?: string;
  userId?: string;
  duration?: number; // milliseconds
  metadata?: LogMetadata;
  error?: ErrorDetails;
}

export interface LogContext {
  service: ServiceName;
  operation: string;
  transactionId?: string;
  userId?: string;
  metadata?: LogMetadata;
}
