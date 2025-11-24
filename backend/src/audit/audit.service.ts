import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel } from '@prisma/client';

export interface AuditEntry {
  id: string;
  transactionId: string;
  operation: string;
  level?: string;
  service?: string;
  userId?: string | null;
  duration?: number | null;
  metadata?: any;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAudit(params: {
    transactionId: string;
    operation: string;
    level?: LogLevel;
    service?: string;
    userId?: string;
    duration?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          transactionId: params.transactionId,
          operation: params.operation,
          level: params.level || LogLevel.INFO,
          service: params.service || 'system',
          userId: params.userId,
          duration: params.duration,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      // Silently fail to prevent logging from breaking the application
      console.error('Failed to write audit log to database:', error.message);
    }
  }

  async getAuditTrail(transactionId: string): Promise<AuditEntry[]> {
    return this.prisma.auditLog.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
