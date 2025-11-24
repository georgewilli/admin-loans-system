import { OperationType } from '@prisma/client';
import {
  PrismaService,
  PrismaTransactionalClient,
} from '../../prisma/prisma.service';
import { RollbackService } from '../rollback.service';

export class TransactionWrapper {
  /**
   * Execute a Prisma transaction with automatic rollback logging
   * @param prisma PrismaService instance
   * @param rollbackService RollbackService instance for logging
   * @param operation Operation type (disbursement or repayment)
   * @param callback Transaction callback function
   * @returns Result from callback
   */
  static async executeWithRollbackLogging<T>(
    prisma: PrismaService,
    rollbackService: RollbackService,
    operation: OperationType,
    callback: (tx: PrismaTransactionalClient) => Promise<T>,
  ): Promise<T> {
    let transactionId: string | undefined;

    try {
      return await prisma.$transaction(async (tx) => {
        // Execute the transaction callback
        const result = await callback(tx);

        // Try to extract transaction ID if result contains it
        if (result && typeof result === 'object' && 'transaction' in result) {
          const txResult = result as any;
          if (txResult.transaction?.id) {
            transactionId = txResult.transaction.id;
          }
        }

        return result;
      });
    } catch (error: any) {
      // Transaction automatically rolled back by Prisma
      // Log the rollback event with available information

      // Log the rollback
      await rollbackService.logRollback({
        transactionId,
        originalOperation: operation,
        rollbackReason: `Transaction failed: ${error.message}`,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
      });

      // Re-throw the error for the caller to handle
      throw error;
    }
  }
}
