import { Injectable } from '@nestjs/common';
import {
  Loan,
  Transaction,
  Payment,
  TransactionType,
  PaymentStatus,
  LoanStatus,
} from '@prisma/client';
import { ScheduleAllocation } from '../interfaces/repayment-calculation.interface';

type PrismaTransaction = any; // Type from Prisma

/**
 * Service responsible for persisting payment results to the database
 * Handles all database write operations for payment processing
 */
@Injectable()
export class PaymentPersistenceService {
  /**
   * Persist all payment results to database
   * Creates payment records, transactions, updates schedules and loan
   */
  async persistPaymentResults(
    tx: PrismaTransaction,
    params: {
      loan: Loan;
      allocations: ScheduleAllocation[];
      totalPrincipalPaid: number;
      paymentDate: Date;
    },
  ): Promise<{
    payments: Payment[];
    transactions: Transaction[];
    updatedLoan: Loan;
    totalPrincipalPaid: number;
  }> {
    const payments: Payment[] = [];
    const transactions: Transaction[] = [];

    // Create payment and transaction records for each allocation
    for (const allocation of params.allocations) {
      const payment = await this.createPaymentRecord(
        tx,
        allocation,
        params.loan.id,
        params.paymentDate,
      );
      payments.push(payment);

      const transaction = await this.createTransactionRecord(tx, payment);
      transactions.push(transaction);

      // Link payment to transaction
      await tx.payment.update({
        where: { id: payment.id },
        data: { transactionId: transaction.id },
      });

      // Update schedule status
      await this.updateScheduleStatus(tx, allocation, params.paymentDate);
    }

    // Update loan balance and status
    const updatedLoan = await this.updateLoanBalance(
      tx,
      params.loan,
      params.totalPrincipalPaid,
    );

    return {
      payments,
      transactions,
      updatedLoan,
      totalPrincipalPaid: params.totalPrincipalPaid,
    };
  }

  /**
   * Create a payment record
   */
  private async createPaymentRecord(
    tx: PrismaTransaction,
    allocation: ScheduleAllocation,
    loanId: string,
    paymentDate: Date,
  ): Promise<Payment> {
    return tx.payment.create({
      data: {
        loanId,
        repaymentScheduleId: allocation.scheduleId,
        amount: allocation.allocation.totalAmount,
        paymentDate,
        principalPaid: allocation.allocation.principalPaid,
        interestPaid: allocation.allocation.interestPaid,
        lateFeePaid: allocation.allocation.lateFeePaid,
        daysLate: allocation.calculation.daysLate,
        status: PaymentStatus.COMPLETED,
      },
    });
  }

  /**
   * Create a transaction record
   */
  private async createTransactionRecord(
    tx: PrismaTransaction,
    payment: Payment,
  ): Promise<Transaction> {
    return tx.transaction.create({
      data: {
        type: TransactionType.REPAYMENT,
        refId: payment.id,
        amount: payment.amount,
      },
    });
  }

  /**
   * Update repayment schedule status
   */
  private async updateScheduleStatus(
    tx: PrismaTransaction,
    allocation: ScheduleAllocation,
    paymentDate: Date,
  ): Promise<void> {
    const updateData: any = {
      status: allocation.newStatus,
    };

    // Set paid date if schedule is fully paid
    if (allocation.newStatus === 'PAID') {
      updateData.paidDate = paymentDate;
    }

    await tx.repaymentSchedule.update({
      where: { id: allocation.scheduleId },
      data: updateData,
    });
  }

  /**
   * Update loan outstanding balance and status
   */
  private async updateLoanBalance(
    tx: PrismaTransaction,
    loan: Loan,
    principalPaid: number,
  ): Promise<Loan> {
    const currentOutstanding = Number(loan.outstandingPrincipal);
    const newOutstanding = Number(
      Math.max(0, currentOutstanding - principalPaid).toFixed(2),
    );

    return tx.loan.update({
      where: { id: loan.id },
      data: {
        outstandingPrincipal: newOutstanding,
        status: newOutstanding === 0 ? LoanStatus.CLOSED : loan.status,
      },
    });
  }
}
