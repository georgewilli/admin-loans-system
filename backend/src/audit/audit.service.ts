import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel, AuditEventType } from '@prisma/client';
import { AuditEventParams, AuditUserContext } from './interfaces/audit-event.interface';

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
  constructor(private prisma: PrismaService) { }

  /**
   * Legacy method - kept for backward compatibility
   * Use logAuditEvent() for new code
   */
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to write audit log to database:', errorMessage);
    }
  }

  /**
   * Enhanced audit logging with comprehensive event tracking
   */
  async logAuditEvent(params: AuditEventParams): Promise<void> {
    try {
      // Calculate changed fields if both old and new values provided
      const changedFields = this.detectChangedFields(params.oldValues, params.newValues);

      await this.prisma.auditLog.create({
        data: {
          // User context
          userId: params.userId,
          userEmail: params.userEmail,
          userRole: params.userRole,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          sessionId: params.sessionId,

          // Event details
          eventType: params.eventType as AuditEventType,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,

          // Changes
          oldValues: params.oldValues,
          newValues: params.newValues,

          // Context (for backward compatibility)
          transactionId: params.transactionId || 'N/A',
          operation: params.operation,
          service: params.service,
          level: this.mapEventToLogLevel(params.eventType as AuditEventType, params.success),

          // Result
          success: params.success ?? true,
          errorMessage: params.errorMessage,

          // Metadata
          duration: params.duration,
          metadata: {
            ...params.metadata,
            changedFields,
          },
        },
      });
    } catch (error) {
      // CRITICAL: Never fail the main operation due to audit logging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to write enhanced audit log:', errorMessage, params);
    }
  }

  /**
   * Helper: Log authentication events
   */
  async logAuthEvent(params: {
    eventType: AuditEventType;
    userEmail: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  }): Promise<void> {
    await this.logAuditEvent({
      eventType: params.eventType as any,
      action: 'EXECUTE',
      service: 'auth',
      operation: params.eventType.toLowerCase().replace(/_/g, ' '),
      userEmail: params.userEmail,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    });
  }

  /**
   * Helper: Log data change events with before/after values
   */
  async logDataChange(params: {
    eventType: AuditEventType;
    action: string;
    resource: string;
    resourceId: string;
    oldValues: any;
    newValues: any;
    userContext?: AuditUserContext;
    transactionId?: string;
    metadata?: any;
  }): Promise<void> {
    await this.logAuditEvent({
      eventType: params.eventType as any,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      service: params.resource.toLowerCase(),
      operation: `${params.action.toLowerCase()}_${params.resource.toLowerCase()}`,
      transactionId: params.transactionId,
      metadata: params.metadata,
      ...params.userContext,
    });
  }

  /**
   * Helper: Log business events (disbursements, payments, etc.)
   */
  async logBusinessEvent(params: {
    eventType: AuditEventType;
    resource: string;
    resourceId: string;
    userId?: string;
    transactionId?: string;
    metadata?: any;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logAuditEvent({
      eventType: params.eventType as any,
      action: 'EXECUTE',
      resource: params.resource,
      resourceId: params.resourceId,
      service: params.resource.toLowerCase(),
      operation: params.eventType.toLowerCase().replace(/_/g, ' '),
      userId: params.userId,
      transactionId: params.transactionId,
      success: params.success,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    });
  }

  /**
   * Get audit trail for a specific transaction
   */
  async getAuditTrail(transactionId: string): Promise<AuditEntry[]> {
    return this.prisma.auditLog.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(resource: string, resourceId: string): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        eventType: true,
        action: true,
        userEmail: true,
        userId: true,
        oldValues: true,
        newValues: true,
        success: true,
        errorMessage: true,
        metadata: true,
      },
    });
  }

  /**
   * Detect which fields changed between old and new values
   */
  private detectChangedFields(oldValues: any, newValues: any): string[] {
    if (!oldValues || !newValues) return [];

    const changedFields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Map event type to appropriate log level
   */
  private mapEventToLogLevel(eventType: AuditEventType, success?: boolean): LogLevel {
    if (success === false) return LogLevel.ERROR;

    const errorEventStrings = [
      'LOGIN_FAILED',
      'PERMISSION_DENIED',
      'DISBURSEMENT_FAILED',
      'PAYMENT_FAILED',
      'SYSTEM_ERROR',
    ];

    if (errorEventStrings.includes(eventType)) {
      return LogLevel.ERROR;
    }

    return LogLevel.INFO;
  }
  /**
   * Find all audit logs with pagination, sorting and filtering
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ data: AuditEntry[]; count: number }> {
    const { skip, take, where, orderBy } = params;

    // Clean up where clause to handle partial matches if needed
    // For now, exact match or simple contains if string
    const processedWhere: any = {};
    if (where) {
      Object.keys(where).forEach((key) => {
        if (key === 'q') {
          // General search not implemented yet, or could search multiple fields
        } else if (typeof where[key] === 'string') {
          processedWhere[key] = { contains: where[key], mode: 'insensitive' };
        } else {
          processedWhere[key] = where[key];
        }
      });
    }

    const [data, count] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take,
        where: processedWhere,
        orderBy,
      }),
      this.prisma.auditLog.count({ where: processedWhere }),
    ]);

    return {
      data: data as unknown as AuditEntry[],
      count
    };
  }
}
