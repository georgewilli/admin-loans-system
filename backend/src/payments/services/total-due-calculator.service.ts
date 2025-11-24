import { Injectable } from '@nestjs/common';
import { Loan, RepaymentSchedule, Payment } from '@prisma/client';
import { RepaymentCalculationService } from './repayment-calculation.service';
import { RepaymentCalculation } from '../interfaces/repayment-calculation.interface';

/**
 * Service for calculating total amount due for a payment
 * Sums up all pending schedules up to the payment date
 */
@Injectable()
export class TotalDueCalculatorService {
  constructor(
    private repaymentCalculationService: RepaymentCalculationService,
  ) {}

  /**
   * Calculate total amount due for all pending schedules up to payment date
   * Only includes schedules with due date <= payment date
   */
  calculateTotalDue(params: {
    pendingSchedules: RepaymentSchedule[];
    paymentDate: Date;
    lastPaymentDate: Date;
    loan: Loan;
    paymentsBySchedule: Map<string, Payment[]>;
  }): {
    totalDue: number;
    calculations: RepaymentCalculation[];
    schedulesCovered: number;
  } {
    const calculations: RepaymentCalculation[] = [];
    let totalDue = 0;
    let currentOutstanding = Number(params.loan.outstandingPrincipal);
    let lastInterestDate = params.lastPaymentDate;

    for (const schedule of params.pendingSchedules) {
      // Only include schedules due on or before payment date
      const dueDate = new Date(schedule.dueDate);
      if (dueDate > params.paymentDate) {
        break; // Stop at future schedules
      }

      const previousPayments = params.paymentsBySchedule.get(schedule.id) || [];

      const calculation =
        this.repaymentCalculationService.calculateRepaymentForSchedule({
          scheduleId: schedule.id,
          installmentNumber: schedule.installmentNumber,
          scheduledPrincipal: Number(schedule.principalAmount),
          scheduledInterest: Number(schedule.interestAmount),
          dueDate,
          currentPaymentDate: params.paymentDate,
          lastPaymentDate: lastInterestDate,
          currentOutstanding,
          annualInterestRate: Number(params.loan.interestRate),
          alreadyPaidPrincipal: this.sumPreviousPayments(
            previousPayments,
            'principalPaid',
          ),
          alreadyPaidInterest: this.sumPreviousPayments(
            previousPayments,
            'interestPaid',
          ),
          alreadyPaidLateFee: this.sumPreviousPayments(
            previousPayments,
            'lateFeePaid',
          ),
        });

      calculations.push(calculation);
      totalDue += calculation.totalDue;

      // Update for next iteration
      currentOutstanding -= calculation.accruedInterest;
      lastInterestDate = params.paymentDate;
    }

    return {
      totalDue: Number(totalDue.toFixed(2)),
      calculations,
      schedulesCovered: calculations.length,
    };
  }

  /**
   * Sum a specific field from previous payments
   */
  private sumPreviousPayments(
    payments: Payment[],
    field: 'principalPaid' | 'interestPaid' | 'lateFeePaid',
  ): number {
    return payments.reduce((sum, p) => sum + Number(p[field]), 0);
  }
}
