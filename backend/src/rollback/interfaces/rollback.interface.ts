import { Prisma } from '@prisma/client';

export interface RollbackRecord {
  id?: string;
  transactionId?: string;
  originalOperation: 'disbursement' | 'repayment';
  rollbackReason: string;
  rollbackTimestamp: Date;
  rolledBackBy: string;
  errorDetails?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface AuditEntry {
  id: string;
  transactionId: string;
  operation: string;
  userId?: string | null;
  metadata?: any;
  createdAt: Date;
}
