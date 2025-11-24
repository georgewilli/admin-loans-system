import { Injectable, Scope } from '@nestjs/common';
import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from 'winston';
import {
  LogEntry,
  LogContext,
  ErrorDetails,
  LogMetadata,
} from './interfaces/log-entry.interface';
import { AuditService } from '../audit/audit.service';
import { LogLevel } from '@prisma/client';

@Injectable({ scope: Scope.DEFAULT })
export class LoggerService {
  private logger: WinstonLogger;

  constructor(private auditService: AuditService) {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'debug',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        format.errors({ stack: true }),
        format.json(),
      ),
      transports: [
        // Console transport for development
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf((info) => {
              // Winston puts the log object in 'message' property when logging an object
              const msg = info.message as any;
              // Merge info and message object if applicable
              const entry =
                typeof msg === 'object' && msg !== null
                  ? { ...info, ...msg }
                  : (info as any);

              const timestamp = entry.timestamp || new Date().toISOString();
              const level = info.level;
              const service = entry.service || 'system';
              const operation = entry.operation || '';
              const transactionId = entry.transactionId;
              const userId = entry.userId;
              const duration = entry.duration;
              const metadata = entry.metadata || {};
              const error = entry.error;

              let output = `[${timestamp}] ${level} [${service}] ${operation}`;

              if (transactionId) {
                output += `\n  transactionId: ${transactionId}`;
              }

              if (userId) {
                output += `\n  userId: ${userId}`;
              }

              if (duration) {
                output += `\n  duration: ${duration}ms`;
              }

              // Add metadata
              Object.keys(metadata).forEach((key) => {
                output += `\n  ${key}: ${JSON.stringify(metadata[key])}`;
              });

              // Add error details if present
              if (error) {
                output += `\n  error: ${JSON.stringify(error, null, 2)}`;
              }

              return output;
            }),
          ),
        }),
        // File transport for production logs (JSON format)
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: format.json(),
        }),
        new transports.File({
          filename: 'logs/combined.log',
          format: format.json(),
        }),
      ],
    });
  }

  /**
   * Write log entry to database
   */
  private async writeToDatabase(entry: LogEntry) {
    // Only write certain log levels to database to avoid overwhelming it
    if (entry.level === LogLevel.DEBUG) return; // Skip debug logs

    // Write to audit table asynchronously (fire and forget)
    this.auditService
      .logAudit({
        transactionId: entry.transactionId || 'unknown',
        operation: entry.operation,
        level: entry.level,
        service: entry.service,
        userId: entry.userId,
        duration: entry.duration,
        metadata: entry.metadata,
      })
      .catch((error) => {
        // Silently fail to prevent logging from breaking the application
        console.error('Failed to write log to database:', error.message);
      });
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    context: LogContext,
    message?: string,
    duration?: number,
    error?: Error | ErrorDetails,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: context.service,
      operation: context.operation,
    };

    if (context.transactionId) entry.transactionId = context.transactionId;
    if (context.userId) entry.userId = context.userId;
    if (duration !== undefined) entry.duration = duration;
    if (context.metadata) entry.metadata = context.metadata;

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      } else {
        entry.error = error;
      }
    }

    return entry;
  }

  /**
   * Log debug message
   */
  debug(context: LogContext, metadata?: LogMetadata) {
    const entry = this.createLogEntry(LogLevel.DEBUG, {
      ...context,
      metadata: { ...context.metadata, ...metadata },
    });
    this.logger.debug(entry);
    // Skip database for debug logs
  }

  /**
   * Log info message
   */
  info(context: LogContext, metadata?: LogMetadata) {
    const entry = this.createLogEntry(LogLevel.INFO, {
      ...context,
      metadata: { ...context.metadata, ...metadata },
    });
    this.logger.info(entry);
    this.writeToDatabase(entry);
  }

  /**
   * Log warning message
   */
  warn(context: LogContext, metadata?: LogMetadata) {
    const entry = this.createLogEntry(LogLevel.WARN, {
      ...context,
      metadata: { ...context.metadata, ...metadata },
    });
    this.logger.warn(entry);
    this.writeToDatabase(entry);
  }

  /**
   * Log error message
   */
  error(
    context: LogContext,
    error: Error | ErrorDetails,
    metadata?: LogMetadata,
  ) {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      {
        ...context,
        metadata: { ...context.metadata, ...metadata },
      },
      undefined,
      undefined,
      error,
    );
    this.logger.error(entry);
    this.writeToDatabase(entry);
  }

  /**
   * Log transaction start
   */
  logTransactionStart(context: LogContext, metadata?: LogMetadata) {
    this.info(
      {
        ...context,
        operation: `${context.operation} - start`,
      },
      metadata,
    );
  }

  /**
   * Log transaction end
   */
  logTransactionEnd(
    context: LogContext,
    duration: number,
    metadata?: LogMetadata,
  ) {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      {
        ...context,
        operation: `${context.operation} - completed`,
        metadata: { ...context.metadata, ...metadata },
      },
      undefined,
      duration,
    );
    this.logger.info(entry);
    this.writeToDatabase(entry);
  }

  /**
   * Log database query
   */
  logQuery(
    context: LogContext,
    query: string,
    duration: number,
    metadata?: LogMetadata,
  ) {
    this.debug({
      ...context,
      metadata: {
        ...context.metadata,
        query,
        duration,
        ...metadata,
      },
    });
  }

  /**
   * Log business logic step
   */
  logBusinessLogic(context: LogContext, step: string, metadata?: LogMetadata) {
    this.info(
      {
        ...context,
        operation: `${context.operation} - ${step}`,
      },
      metadata,
    );
  }
}
