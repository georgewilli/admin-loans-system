import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RollbackRecord } from './interfaces/rollback.interface';
import { RollbackRepository } from './rollback.repository';
import { AccountsService } from '../accounts/accounts.service';
import {
  AccountType,
  DisbursementStatus,
  LoanStatus,
  PaymentStatus,
  RepaymentScheduleStatus,
  OperationType,
} from '@prisma/client';
import { Prisma } from '@prisma/client';


@Injectable()
export class RollbackService {
  constructor(
    private prisma: PrismaService,
    private rollbackRepository: RollbackRepository,
    private auditService: AuditService,
    private accountsService: AccountsService,
  ) { }

  /**
   * Log a transaction rollback event when Prisma transaction fails
   */
  async logRollback(params: {
    transactionId?: string;
    originalOperation: OperationType;
    rollbackReason: string;
    errorDetails?: any;
  }): Promise<RollbackRecord> {
    const rollbackRecord = await this.rollbackRepository.create({
      transactionId: params.transactionId || 'N/A',
      originalOperation: params.originalOperation,
      rolledBackBy: 'SYSTEM',
      rollbackReason: params.rollbackReason,
      compensatingActions: {
        automaticRollback: true,
        message: 'Transaction automatically rolled back by Prisma',
      },
      errorDetails: params.errorDetails,
    });

    // Log to audit trail
    if (params.transactionId) {
      await this.auditService.logAudit({
        transactionId: params.transactionId,
        operation: 'ROLLBACK',
        metadata: {
          reason: params.rollbackReason,
          originalOperation: params.originalOperation,
          errorDetails: params.errorDetails,
        },
      });
    }

    return {
      id: rollbackRecord.id,
      transactionId: rollbackRecord.transactionId,
      originalOperation: rollbackRecord.originalOperation as
        | 'disbursement'
        | 'repayment',
      rollbackReason: rollbackRecord.rollbackReason,
      rollbackTimestamp: rollbackRecord.createdAt,
      rolledBackBy: rollbackRecord.rolledBackBy,
      errorDetails: rollbackRecord.errorDetails as any,
    };
  }

  /**
   * Manually rollback a disbursement (Admin action)
   */
  async rollbackDisbursement(
    disbursementId: string,
    adminUserId: string,
    reason: string,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const disbursement = await tx.disbursement.findUnique({
        where: { id: disbursementId },
        include: { loan: true },
      });

      if (!disbursement) {
        throw new NotFoundException(`Disbursement ${disbursementId} not found`);
      }

      if (disbursement.status !== DisbursementStatus.COMPLETED) {
        throw new BadRequestException(
          `Can only rollback completed disbursements. Status: ${disbursement.status}`,
        );
      }

      if (disbursement.rolledBackAt) {
        throw new BadRequestException('Disbursement already rolled back');
      }

      // Check for existing completed payments
      const existingPayments = await tx.payment.findFirst({
        where: {
          loanId: disbursement.loanId,
          status: PaymentStatus.COMPLETED,
        },
      });

      if (existingPayments) {
        throw new BadRequestException(
          'Cannot rollback disbursement because the loan has active payments. Rollback payments first.',
        );
      }

      const platformAccount = await tx.account.findFirst({
        where: { type: AccountType.PLATFORM },
      });

      if (!platformAccount) {
        throw new Error('Platform account not found');
      }

      // Reverse transfer: User → Platform
      await this.accountsService.transferFunds(tx, {
        fromAccountId: disbursement.loan.accountId,
        toAccountId: platformAccount.id,
        amount: Number(disbursement.amount),
        description: `Rollback disbursement ${disbursementId}`,
        skipBalanceCheck: false,
      });

      await tx.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: DisbursementStatus.ROLLED_BACK,
          rolledBackAt: new Date(),
        },
      });

      await tx.loan.update({
        where: { id: disbursement.loanId },
        data: { status: LoanStatus.APPROVED, outstandingPrincipal: 0 },
      });

      await tx.repaymentSchedule.deleteMany({
        where: { loanId: disbursement.loanId },
      });

      await this.rollbackRepository.create(
        {
          transactionId: disbursement.transactionId || 'N/A',
          originalOperation: OperationType.DISBURSEMENT,
          rollbackReason: reason || 'Manual rollback by admin',
          compensatingActions: {
            moneyTransferred: true,
            from: disbursement.loan.accountId,
            to: platformAccount.id,
            amount: Number(disbursement.amount),
          },
          rolledBackBy: adminUserId,
        },
        tx,
      );

      await this.auditService.logAudit({
        transactionId: disbursement.transactionId || disbursementId,
        operation: 'MANUAL_ROLLBACK_DISBURSEMENT',
        metadata: { disbursementId, loanId: disbursement.loanId, adminUserId, reason },
      });
    });
  }

  /**
   * Manually rollback a payment (Admin action)
   */
  async rollbackPayment(
    paymentId: string,
    adminUserId: string,
    reason: string,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { loan: true },
      });

      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException(
          `Can only rollback completed payments. Status: ${payment.status}`,
        );
      }

      const platformAccount = await tx.account.findFirst({
        where: { type: AccountType.PLATFORM },
      });

      if (!platformAccount) {
        throw new Error('Platform account not found');
      }

      const principalPaid = Number(payment.principalPaid);

      // Reverse transfer: Platform → User (principal only)
      if (principalPaid > 0) {
        await this.accountsService.transferFunds(tx, {
          fromAccountId: platformAccount.id,
          toAccountId: payment.loan.accountId,
          amount: principalPaid,
          description: `Rollback payment ${paymentId}`,
          skipBalanceCheck: true,
        });
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.ROLLED_BACK },
      });

      const newOutstanding =
        Number(payment.loan.outstandingPrincipal) + principalPaid;
      await tx.loan.update({
        where: { id: payment.loanId },
        data: {
          outstandingPrincipal: newOutstanding,
          status: newOutstanding > 0 ? LoanStatus.ACTIVE : payment.loan.status,
        },
      });

      if (payment.repaymentScheduleId) {
        await tx.repaymentSchedule.update({
          where: { id: payment.repaymentScheduleId },
          data: { status: RepaymentScheduleStatus.ROLLED_BACK, paidDate: null },
        });
      }

      await this.rollbackRepository.create(
        {
          transactionId: payment.transactionId || 'N/A',
          originalOperation: OperationType.REPAYMENT,
          rollbackReason: reason || 'Manual rollback by admin',
          compensatingActions: {
            moneyTransferred: principalPaid > 0,
            from: platformAccount.id,
            to: payment.loan.accountId,
            amount: principalPaid,
          },
          rolledBackBy: adminUserId,
        },
        tx,
      );

      await this.auditService.logAudit({
        transactionId: payment.transactionId || paymentId,
        operation: 'MANUAL_ROLLBACK_PAYMENT',
        metadata: {
          paymentId,
          loanId: payment.loanId,
          principalPaid,
          adminUserId,
          reason,
        },
      });
    });
  }



  async getRollbackRecords(filters?: {
    transactionId?: string;
    operation?: OperationType;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<RollbackRecord[]> {
    const where: Prisma.RollbackRecordWhereInput = {};

    if (filters) {
      if (filters.transactionId) where.transactionId = filters.transactionId;
      if (filters.operation) where.originalOperation = filters.operation;
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }
    }

    const records = await this.rollbackRepository.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ({
      id: record.id,
      transactionId: record.transactionId,
      originalOperation: record.originalOperation as
        | 'disbursement'
        | 'repayment',
      rollbackReason: record.rollbackReason,
      rollbackTimestamp: record.createdAt,
      rolledBackBy: record.rolledBackBy,
      errorDetails: record.errorDetails as any,
    }));
  }

  /**
   * Check if a transaction can be rolled back
   */
  async canRollback(transactionId: string): Promise<boolean> {
    const existingRollback =
      await this.rollbackRepository.findByTransactionId(transactionId);
    return !existingRollback;
  }

  /**
   * Get audit trail for a specific transaction
   */
  async getAuditTrail(transactionId: string) {
    return this.auditService.getAuditTrail(transactionId);
  }
}
