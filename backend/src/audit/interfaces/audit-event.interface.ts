/**
 * Audit event action types
 */
export enum AuditAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    EXECUTE = 'EXECUTE',
}

/**
 * Parameters for logging a comprehensive audit event
 */
export interface AuditEventParams {
    // Who & Where
    userId?: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;

    // What
    eventType: string; // Will be AuditEventType from Prisma
    action: AuditAction | string;
    resource?: string;
    resourceId?: string;

    // Changes
    oldValues?: any;
    newValues?: any;

    // Context
    service: string;
    operation: string;
    transactionId?: string;

    // Result
    success?: boolean;
    errorMessage?: string;
    duration?: number;
    metadata?: any;
}

/**
 * User context for audit logging (extracted from request)
 */
export interface AuditUserContext {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}
