import { RepaymentScheduleStatus } from '@prisma/client';

/**
 * Represents the calculation result for a repayment
 * Based on time-based calculations (days since last payment)
 */
export interface RepaymentCalculation {
  outstandingPrincipal: number;
  accruedInterest: number; // calculated based on days since last payment
  lateFee: number; // if payment is late (after 3-day grace)
  totalDue: number; // sum of all amounts
  daysLate: number; // days past due date
  daysSinceLastPayment: number; // for interest calculation
}

/**
 * Represents the allocation of a payment to a specific schedule
 */
export interface ScheduleAllocation {
  scheduleId: string;
  installmentNumber: number;
  calculation: RepaymentCalculation;
  allocation: PaymentAllocation;
  newStatus: RepaymentScheduleStatus;
}

/**
 * Represents how a payment amount is allocated across components
 */
export interface PaymentAllocation {
  interestPaid: number;
  lateFeePaid: number;
  principalPaid: number;
  totalAmount: number;
}

/**
 * Input parameters for calculating repayment
 */
export interface RepaymentCalculationParams {
  scheduleId: string;
  installmentNumber: number;
  scheduledPrincipal: number;
  scheduledInterest: number;
  dueDate: Date;
  currentPaymentDate: Date;
  lastPaymentDate: Date;
  currentOutstanding: number;
  annualInterestRate: number;
  alreadyPaidPrincipal: number;
  alreadyPaidInterest: number;
  alreadyPaidLateFee: number;
}
