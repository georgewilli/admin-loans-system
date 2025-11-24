import { Injectable, BadRequestException } from '@nestjs/common';
import { RepaymentSchedule, Payment } from '@prisma/client';
import { InterestCalculator } from '../logic/interest-calculator';
import { LateFeeCalculator } from '../logic/late-fee-calculator';
import {
  RepaymentCalculation,
  RepaymentCalculationParams,
} from '../interfaces/repayment-calculation.interface';

/**
 * Service responsible for all repayment calculation logic
 * Handles time-based interest accrual, late fee calculation, and validation
 */
@Injectable()
export class RepaymentCalculationService {
  private static readonly MINIMUM_DAYS_BETWEEN_PAYMENTS = 30;

  /**
   * Calculate repayment details for a specific schedule
   */
  calculateRepaymentForSchedule(
    params: RepaymentCalculationParams,
  ): RepaymentCalculation {
    const daysSinceLastPayment = this.calculateDaysSinceLastPayment(
      params.lastPaymentDate,
      params.currentPaymentDate,
    );

    const daysLate = this.calculateDaysLate(
      params.dueDate,
      params.currentPaymentDate,
    );

    // Calculate accrued interest based on current outstanding principal
    const accruedInterest = InterestCalculator.calculateAccruedInterest(
      params.currentOutstanding,
      params.annualInterestRate,
      daysSinceLastPayment,
    );

    // Calculate late fee based on payment timing
    const lateFee = LateFeeCalculator.calculateLateFee(daysLate);

    // Calculate remaining amounts needed for this installment
    const remainingInterest = Math.max(
      0,
      accruedInterest - params.alreadyPaidInterest,
    );
    const remainingLateFee = Math.max(0, lateFee - params.alreadyPaidLateFee);
    const remainingPrincipal = Math.max(
      0,
      params.scheduledPrincipal - params.alreadyPaidPrincipal,
    );

    const totalDue = remainingInterest + remainingLateFee + remainingPrincipal;

    return {
      outstandingPrincipal: params.currentOutstanding,
      accruedInterest: remainingInterest,
      lateFee: remainingLateFee,
      totalDue,
      daysLate,
      daysSinceLastPayment,
    };
  }

  /**
   * Validate that sufficient time has passed since last payment
   * Prevents early payments (minimum 30 days between payments)
   */
  validatePaymentInterval(
    lastPaymentDate: Date,
    currentPaymentDate: Date,
  ): void {
    const daysSinceLastPayment = this.calculateDaysSinceLastPayment(
      lastPaymentDate,
      currentPaymentDate,
    );

    if (
      daysSinceLastPayment <
      RepaymentCalculationService.MINIMUM_DAYS_BETWEEN_PAYMENTS
    ) {
      throw new BadRequestException(
        `Payment rejected: Minimum ${RepaymentCalculationService.MINIMUM_DAYS_BETWEEN_PAYMENTS} days required between payments. ` +
          `Last payment was ${daysSinceLastPayment} days ago.`,
      );
    }
  }

  /**
   * Calculate the number of days between two dates
   */
  private calculateDaysSinceLastPayment(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate how many days late a payment is
   * Returns 0 if payment is on time or early
   */
  private calculateDaysLate(dueDate: Date, paymentDate: Date): number {
    return Math.max(
      0,
      this.calculateDaysSinceLastPayment(dueDate, paymentDate),
    );
  }
}
