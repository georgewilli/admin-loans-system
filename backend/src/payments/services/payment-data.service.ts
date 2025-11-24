import { Injectable } from '@nestjs/common';
import {
  Loan,
  Disbursement,
  RepaymentSchedule,
  Payment,
  RepaymentScheduleStatus,
  PaymentStatus,
} from '@prisma/client';

type PrismaTransaction = any; // Type from Prisma

/**
 * Service responsible for fetching all data needed for payment processing
 * Optimized to minimize database queries
 */
@Injectable()
export class PaymentDataService {
  /**
   * Fetch all data needed for payment processing in minimal queries
   * - Loan with disbursement (1 query)
   * - Pending schedules (1 query)
   * - Existing payments (1 query)
   * - Derived: last payment date, grouped payments
   */
  async fetchPaymentData(
    tx: PrismaTransaction,
    loanId: string,
  ): Promise<{
    loan: Loan & { disbursement: Disbursement };
    pendingSchedules: RepaymentSchedule[];
    existingPayments: Payment[];
    lastPaymentDate: Date;
    paymentsBySchedule: Map<string, Payment[]>;
  }> {
    // Query 1: Get loan with disbursement
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { disbursement: true },
    });

    // Query 2: Get all pending/partially paid schedules
    const pendingSchedules = await tx.repaymentSchedule.findMany({
      where: {
        loanId,
        status: {
          in: [
            RepaymentScheduleStatus.PENDING,
            RepaymentScheduleStatus.PARTIALLY_PAID,
          ],
        },
      },
      orderBy: { installmentNumber: 'asc' },
    });

    // Query 3: Get all completed payments
    const existingPayments = await tx.payment.findMany({
      where: {
        loanId,
        status: PaymentStatus.COMPLETED,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Derive last payment date
    const lastPaymentDate =
      existingPayments.length > 0
        ? new Date(existingPayments[existingPayments.length - 1].paymentDate)
        : loan?.disbursement
          ? new Date(loan.disbursement.disbursementDate)
          : new Date();

    // Group payments by schedule for quick lookup
    const paymentsBySchedule = this.groupPaymentsBySchedule(existingPayments);

    return {
      loan,
      pendingSchedules,
      existingPayments,
      lastPaymentDate,
      paymentsBySchedule,
    };
  }

  /**
   * Group payments by schedule ID for efficient lookups
   */
  private groupPaymentsBySchedule(payments: Payment[]): Map<string, Payment[]> {
    const grouped = new Map<string, Payment[]>();

    for (const payment of payments) {
      if (payment.repaymentScheduleId) {
        if (!grouped.has(payment.repaymentScheduleId)) {
          grouped.set(payment.repaymentScheduleId, []);
        }
        grouped.get(payment.repaymentScheduleId)!.push(payment);
      }
    }

    return grouped;
  }
}
