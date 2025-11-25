import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentsRepository } from './payments.repository';
import { LoansRepository } from 'src/loans/loans.repository';
import { RepaymentsService } from 'src/repayments/repayments.service';
import { RollbackService } from 'src/rollback/rollback.service';
import { TransactionWrapper } from 'src/rollback/helpers/transaction-wrapper.helper';
import { AccountsService } from 'src/accounts/accounts.service';
import {
  LoanStatus,
  RepaymentScheduleStatus,
  PaymentStatus,
  TransactionType,
  OperationType,
  Payment,
  Transaction,
} from '@prisma/client';
import { LoggerService } from 'src/logger/logger.service';
import { PAYMENT_CONSTANTS } from 'src/constants';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private paymentsRepository: PaymentsRepository,
    private loansRepository: LoansRepository,
    private repaymentsService: RepaymentsService,
    private rollbackService: RollbackService,
    private accountsService: AccountsService,
    private logger: LoggerService,
  ) { }

  async findAll() {
    return this.paymentsRepository.findAll();
  }

  async findOne(id: string) {
    return this.paymentsRepository.findById(id);
  }

  /**
   * Calculate the number of days between two dates
   */
  private calculateDaysBetween(fromDate: Date, toDate: Date): number {
    const timeDiff = toDate.getTime() - fromDate.getTime();
    return Math.floor(timeDiff / PAYMENT_CONSTANTS.MILLISECONDS_PER_DAY);
  }

  /**
   * Calculate accrued interest on outstanding principal
   * 
   * Formula: Principal * Daily Rate * Days Since Last Payment
   * Daily Rate = (Annual Rate / 100) / 365
   */
  private calculateAccruedInterest(
    outstandingPrincipal: number,
    annualInterestRate: number,
    daysSinceLastPayment: number,
  ): number {
    const annualRateDecimal = annualInterestRate / 100;
    const dailyRate = annualRateDecimal / PAYMENT_CONSTANTS.DAYS_PER_YEAR;
    return outstandingPrincipal * dailyRate * daysSinceLastPayment;
  }

  /**
   * Calculate late fee for a repayment based on days late
   */
  private calculateLateFee(daysLate: number): number {
    return daysLate > 0 ? PAYMENT_CONSTANTS.FLAT_LATE_FEE : 0;
  }

  /**
   * Process Payment - Simplified Version
   *
   * Steps:
   * 1. Validate loan and get data
   * 2. Get last payment date
   * 3. Calculate total accrued interest from last payment to current payment date
   * 4. Determine which repayments are due based on payment date
   * 5. Calculate late fees for each due repayment
   * 6. For each due repayment:
   *    - Create payment record
   *    - Transfer money from user to platform
   *    - Update repayment status to PAID
   *    - Deduct from accrued interest
   * 7. If accrued interest remains, partially pay next repayment
   */
  async processPayment(dto: CreatePaymentDto) {
    const startTime = Date.now();
    const paymentId = `pay_${Date.now()}`;

    try {
      return await TransactionWrapper.executeWithRollbackLogging(
        this.prisma,
        this.rollbackService,
        OperationType.REPAYMENT,
        async (tx) => {
          const paymentDate = new Date(dto.paymentDate);

          this.logger.logTransactionStart({
            service: 'payment',
            operation: 'processPayment',
            transactionId: paymentId,
            metadata: { loanId: dto.loanId, paymentDate: dto.paymentDate },
          });

          // ========================================
          // STEP 1: Validate Loan
          // ========================================
          const loan = await tx.loan.findUnique({
            where: { id: dto.loanId },
            include: { disbursement: true },
          });

          if (!loan) {
            throw new BadRequestException('Loan not found');
          }

          if (loan.status !== LoanStatus.ACTIVE) {
            throw new BadRequestException('Loan is not active');
          }

          if (!loan.disbursement) {
            throw new BadRequestException('Loan has no disbursement');
          }

          const outstandingPrincipal = Number(loan.outstandingPrincipal);
          if (outstandingPrincipal <= 0) {
            throw new BadRequestException('Loan is already fully repaid');
          }

          // ========================================
          // STEP 2: Get Last Payment Date
          // ========================================
          const lastPayment = await tx.payment.findFirst({
            where: { loanId: dto.loanId, status: PaymentStatus.COMPLETED },
            orderBy: { paymentDate: 'desc' },
          });

          const lastPaymentDate = lastPayment
            ? new Date(lastPayment.paymentDate)
            : new Date(loan.disbursement.disbursementDate);

          // Validate payment date is after last payment
          if (paymentDate < lastPaymentDate) {
            throw new BadRequestException(
              'Payment date cannot be before last payment',
            );
          }

          // ========================================
          // STEP 3: Calculate Total Accrued Interest
          // ========================================
          const daysSinceLastPayment = this.calculateDaysBetween(
            lastPaymentDate,
            paymentDate,
          );

          const totalAccruedInterest = this.calculateAccruedInterest(
            outstandingPrincipal,
            Number(loan.interestRate),
            daysSinceLastPayment,
          );

          // ========================================
          // STEP 4: Get Due Repayments & Calculate Fees
          // ========================================
          const allPendingRepayments = await tx.repaymentSchedule.findMany({
            where: {
              loanId: dto.loanId,
              status: {
                in: [
                  RepaymentScheduleStatus.PENDING,
                  RepaymentScheduleStatus.PARTIALLY_PAID,
                ],
              },
            },
            orderBy: { installmentNumber: 'asc' },
          });

          // Filter due repayments
          const dueRepayments = allPendingRepayments.filter(
            (rep) => new Date(rep.dueDate) <= paymentDate,
          );

          // Calculate total late fees
          let totalLateFees = 0;
          const repaymentLateFees = new Map<string, number>();

          for (const rep of dueRepayments) {
            const dueDate = new Date(rep.dueDate);
            const daysLate = Math.max(
              0,
              this.calculateDaysBetween(dueDate, paymentDate),
            );

            // Apply grace period
            if (daysLate > PAYMENT_CONSTANTS.GRACE_PERIOD_DAYS) {
              const fee = PAYMENT_CONSTANTS.FLAT_LATE_FEE;
              totalLateFees += fee;
              repaymentLateFees.set(rep.id, fee);
            } else {
              repaymentLateFees.set(rep.id, 0);
            }
          }

          // ========================================
          // STEP 5: Determine Payment Amount & Allocation (Waterfall)
          // ========================================

          // Calculate total due (Principal + Interest + Fees)
          const totalPrincipalDue = dueRepayments.reduce(
            (sum, rep) => sum + Number(rep.principalAmount),
            0
          );
          const totalDue = totalPrincipalDue + totalAccruedInterest + totalLateFees;

          // Use provided amount or default to total due
          const paymentAmount = dto.amount ? Number(dto.amount) : totalDue;

          // 1. Pay Interest First
          const interestPaid = Math.min(paymentAmount, totalAccruedInterest);
          let remainingForFeesAndPrincipal = paymentAmount - interestPaid;

          // 2. Pay Late Fees Second
          const feesPaid = Math.min(remainingForFeesAndPrincipal, totalLateFees);
          let remainingForPrincipal = remainingForFeesAndPrincipal - feesPaid;

          // 3. Pay Principal Last
          const principalPaid = Math.min(remainingForPrincipal, totalPrincipalDue);

          // ========================================
          // STEP 6: Apply Payments to Schedules
          // ========================================
          const payments: Payment[] = [];
          const transactions: Transaction[] = [];

          // Trackers for distribution
          let distributedInterest = 0;
          let distributedFees = 0;
          let distributedPrincipal = 0;

          // We iterate through due repayments to allocate the funds.
          // If we have money left after due repayments (unlikely if logic is correct unless overpayment), 
          // it stays as "principalPaid" but might need to be applied to future schedules?
          // For simplicity, we strictly apply to DUE schedules first. 
          // If there is excess principal (overpayment), we apply it to the next pending schedule.

          // Combine due repayments with future repayments if we have excess funds?
          // Requirement says "Partial payments are allowed", doesn't explicitly say "Overpayments".
          // We'll stick to applying to due repayments first.

          const schedulesToPay = [...dueRepayments];

          // If we have more principal to pay than what is due, add next schedules
          if (principalPaid > totalPrincipalDue) {
            const futureRepayments = allPendingRepayments.filter(
              rep => !dueRepayments.includes(rep)
            );
            schedulesToPay.push(...futureRepayments);
          }

          for (let i = 0; i < schedulesToPay.length; i++) {
            const rep = schedulesToPay[i];
            const isLast = i === schedulesToPay.length - 1;

            // Allocation for this schedule
            let repInterest = 0;
            let repFee = 0;
            let repPrincipal = 0;

            // Distribute Interest (attach to first schedule or spread? Spreading is cleaner for data)
            // Simple approach: Attach all interest to the first due schedule, or spread proportionally.
            // Spreading proportionally to principal amount is fair.
            if (interestPaid > distributedInterest) {
              const remainingInterest = interestPaid - distributedInterest;
              if (isLast) {
                repInterest = remainingInterest;
              } else {
                // Proportional share
                const ratio = Number(rep.principalAmount) / totalPrincipalDue; // Approximation
                // Fallback to simple "fill up" if ratio is weird
                repInterest = Math.min(remainingInterest, interestPaid * (Number(rep.principalAmount) / totalPrincipalDue) || remainingInterest);
              }
              distributedInterest += repInterest;
            }

            // Distribute Fees (Specific to schedule)
            const feeForThisRep = repaymentLateFees.get(rep.id) || 0;
            if (feeForThisRep > 0 && distributedFees < feesPaid) {
              const feeToPay = Math.min(feeForThisRep, feesPaid - distributedFees);
              repFee = feeToPay;
              distributedFees += repFee;
            }

            // Distribute Principal (Waterfall: fill oldest first)
            if (distributedPrincipal < principalPaid) {
              // Get previously paid principal for this schedule
              const previousPayments = await tx.payment.findMany({
                where: {
                  repaymentScheduleId: rep.id,
                  status: PaymentStatus.COMPLETED,
                },
                select: {
                  principalPaid: true,
                },
              });

              const previouslyPaidPrincipal = previousPayments.reduce(
                (sum, p) => sum + Number(p.principalPaid),
                0
              );

              // Calculate remaining principal balance for this schedule
              const repPrincipalBalance = Number(rep.principalAmount) - previouslyPaidPrincipal;

              const amountToPay = Math.min(
                repPrincipalBalance,
                principalPaid - distributedPrincipal
              );
              repPrincipal = amountToPay;
              distributedPrincipal += repPrincipal;
            }

            const repTotal = repInterest + repFee + repPrincipal;

            if (repTotal > 0) {
              // Create Payment
              const payment = await tx.payment.create({
                data: {
                  loanId: loan.id,
                  repaymentScheduleId: rep.id,
                  amount: repTotal,
                  paymentDate: paymentDate,
                  principalPaid: repPrincipal,
                  interestPaid: repInterest,
                  lateFeePaid: repFee,
                  daysLate: (repaymentLateFees.get(rep.id) || 0) > 0 ? this.calculateDaysBetween(new Date(rep.dueDate), paymentDate) : 0,
                  status: PaymentStatus.COMPLETED,
                },
              });

              // Create Transaction
              const transaction = await tx.transaction.create({
                data: {
                  type: TransactionType.REPAYMENT,
                  refId: payment.id,
                  amount: repTotal,
                },
              });

              // Link
              await tx.payment.update({
                where: { id: payment.id },
                data: { transactionId: transaction.id },
              });

              // Update Schedule Status
              // If principal is fully paid, mark as PAID (assuming interest/fees are covered or don't block status)
              // Usually status depends on Principal.
              const isPrincipalFullyPaid = Math.abs(repPrincipal - Number(rep.principalAmount)) < 0.01;

              await tx.repaymentSchedule.update({
                where: { id: rep.id },
                data: {
                  status: isPrincipalFullyPaid ? RepaymentScheduleStatus.PAID : RepaymentScheduleStatus.PARTIALLY_PAID,
                  paidDate: isPrincipalFullyPaid ? paymentDate : null,
                },
              });

              payments.push(payment);
              transactions.push(transaction);
            }
          }

          // Transfer Money (Total)
          await this.accountsService.transferFromBorrower(
            tx,
            loan.accountId,
            paymentAmount,
            `Repayment (Int: ${interestPaid}, Fee: ${feesPaid}, Prin: ${principalPaid})`
          );

          // Update Loan Outstanding
          // We only reduce by principal paid
          const newOutstanding = outstandingPrincipal - principalPaid;
          await tx.loan.update({
            where: { id: loan.id },
            data: {
              outstandingPrincipal: newOutstanding,
              status: newOutstanding === 0 ? LoanStatus.CLOSED : loan.status,
            },
          });

          // TEST ONLY: Error injection
          if (process.env.TEST_INJECT_ERROR === 'PAYMENT') {
            throw new Error('TEST: Simulated payment failure');
          }

          // Log transaction end
          const totalDuration = Date.now() - startTime;
          const totalAmountCharged = payments.reduce(
            (sum, p) => sum + Number(p.amount),
            0,
          );

          this.logger.logTransactionEnd(
            {
              service: 'payment',
              operation: 'processPayment',
              transactionId: paymentId,
              userId: loan.accountId,
            },
            totalDuration,
            {
              totalAmountCharged: totalAmountCharged.toFixed(2),
              totalPrincipalPaid: principalPaid,
              totalInterestPaid: totalAccruedInterest.toFixed(2),
              totalLateFee: totalLateFees,
              schedulesCovered: dueRepayments.length,
              newOutstanding,
            },
          );

          return {
            payments,
            transactions,
            totalAmountCharged,
            totalPrincipalPaid: principalPaid,
            totalInterestPaid: totalAccruedInterest,
            totalLateFee: totalLateFees,
            schedulesCovered: dueRepayments.length,
            newOutstandingPrincipal: newOutstanding,
          };
        },
      );
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      this.logger.error(
        {
          service: 'payment',
          operation: 'processPayment',
          transactionId: paymentId,
          metadata: { loanId: dto.loanId, duration: totalDuration },
        },
        error,
      );

      throw error;
    }
  }
}
