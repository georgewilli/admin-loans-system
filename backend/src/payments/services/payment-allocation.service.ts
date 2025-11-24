import { Injectable } from '@nestjs/common';
import { AllocationEngine } from '../logic/allocation-engine';
import {
  RepaymentCalculation,
  ScheduleAllocation,
  PaymentAllocation,
} from '../interfaces/repayment-calculation.interface';
import { RepaymentScheduleStatus } from '@prisma/client';

/**
 * Service responsible for allocating payment amounts across schedules
 * Handles the distribution of payment funds following the priority:
 * Interest → Late Fee → Principal
 */
@Injectable()
export class PaymentAllocationService {
  /**
   * Allocate a payment across multiple repayment schedules
   * Processes schedules in order until payment is exhausted
   */
  allocatePaymentAcrossSchedules(params: {
    paymentAmount: number;
    schedules: Array<any>; // Use any to accept Prisma RepaymentSchedule with Decimal types
    calculations: RepaymentCalculation[];
  }): ScheduleAllocation[] {
    let remainingAmount = params.paymentAmount;
    const allocations: ScheduleAllocation[] = [];

    for (let i = 0; i < params.schedules.length; i++) {
      if (remainingAmount <= 0) break;

      const schedule = params.schedules[i];
      const calculation = params.calculations[i];

      // Amount to allocate to this schedule (minimum of remaining and what's due)
      const amountForSchedule = Math.min(remainingAmount, calculation.totalDue);

      // Allocate to this schedule using priority: interest → late fee → principal
      const allocation = this.allocateToSchedule(
        amountForSchedule,
        calculation,
      );

      // Determine new status based on principal paid
      const newStatus = this.determineScheduleStatus(
        allocation.principalPaid,
        Number(schedule.principalAmount),
        calculation,
      );

      allocations.push({
        scheduleId: schedule.id,
        installmentNumber: schedule.installmentNumber,
        calculation,
        allocation,
        newStatus,
      });

      remainingAmount -= allocation.totalAmount;
    }

    return allocations;
  }

  /**
   * Allocate payment to a single schedule following priority rules
   */
  private allocateToSchedule(
    amount: number,
    calculation: RepaymentCalculation,
  ): PaymentAllocation {
    const result = AllocationEngine.allocate(
      amount,
      calculation.accruedInterest,
      calculation.lateFee,
    );

    return {
      interestPaid: result.interestPaid,
      lateFeePaid: result.lateFeePaid,
      principalPaid: result.principalPaid,
      totalAmount: amount,
    };
  }

  /**
   * Determine the new status for a schedule based on payment allocation
   */
  private determineScheduleStatus(
    principalPaid: number,
    scheduledPrincipal: number,
    calculation: RepaymentCalculation,
  ): RepaymentScheduleStatus {
    const totalPrincipalPaid = principalPaid;

    if (totalPrincipalPaid >= scheduledPrincipal) {
      return RepaymentScheduleStatus.PAID;
    } else if (totalPrincipalPaid > 0) {
      return RepaymentScheduleStatus.PARTIALLY_PAID;
    } else {
      return RepaymentScheduleStatus.PENDING;
    }
  }
}
