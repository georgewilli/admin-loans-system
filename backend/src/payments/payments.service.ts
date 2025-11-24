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
  AccountType,
  LoanStatus,
  RepaymentScheduleStatus,
  PaymentStatus,
  TransactionType,
  OperationType,
} from '@prisma/client';
import { LoggerService } from 'src/logger/logger.service';

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
  ) {}

  async findAll() {
    return this.paymentsRepository.findAll();
  }

  async findOne(id: string) {
    return this.paymentsRepository.findById(id);
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
          const daysSinceLastPayment = Math.floor(
            (paymentDate.getTime() - lastPaymentDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );

          const annualRate = Number(loan.interestRate) / 100; // Convert to decimal
          const dailyRate = annualRate / 365;
          const totalAccruedInterest =
            outstandingPrincipal * dailyRate * daysSinceLastPayment;

          this.logger.logBusinessLogic(
            {
              service: 'payment',
              operation: 'processPayment',
              transactionId: paymentId,
            },
            'calculateAccruedInterest',
            {
              daysSinceLastPayment,
              outstandingPrincipal,
              annualRate: loan.interestRate,
              totalAccruedInterest: totalAccruedInterest.toFixed(2),
            },
          );

          // ========================================
          // STEP 4: Get Due Repayments
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

          if (allPendingRepayments.length === 0) {
            throw new BadRequestException('No pending schedules found');
          }

          // Determine which repayments are due (due date <= payment date)
          const dueRepayments = allPendingRepayments.filter(
            (rep) => new Date(rep.dueDate) <= paymentDate,
          );

          if (dueRepayments.length === 0) {
            throw new BadRequestException(
              'No repayments are due yet at this payment date',
            );
          }

          // ========================================
          // STEP 5: Calculate Late Fees
          // ========================================
          const FLAT_LATE_FEE = 25; // $25 flat fee per late repayment

          // ========================================
          // STEP 6: Process Each Due Repayment
          // ========================================

          let remainingAccruedInterest = totalAccruedInterest;
          const payments: any[] = [];
          const transactions: any[] = [];
          let totalPrincipalPaid = 0;
          let totalLateFee = 0;

          for (const repayment of dueRepayments) {
            // Calculate late fee for this repayment
            const dueDate = new Date(repayment.dueDate);
            const daysLate = Math.max(
              0,
              Math.floor(
                (paymentDate.getTime() - dueDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            );
            const lateFee = daysLate > 0 ? FLAT_LATE_FEE : 0;
            totalLateFee += lateFee;

            const principalAmount = Number(repayment.principalAmount);

            // Interest for this repayment (proportional to principal)
            const interestForThisRepayment = Math.min(
              remainingAccruedInterest,
              (principalAmount / outstandingPrincipal) * totalAccruedInterest,
            );

            const paymentAmount =
              principalAmount + lateFee + interestForThisRepayment;

            // Create payment record
            const payment = await tx.payment.create({
              data: {
                loanId: loan.id,
                repaymentScheduleId: repayment.id,
                amount: paymentAmount,
                paymentDate: paymentDate,
                principalPaid: principalAmount,
                interestPaid: interestForThisRepayment,
                lateFeePaid: lateFee,
                daysLate: daysLate,
                status: PaymentStatus.COMPLETED,
              },
            });

            // Create transaction record
            const transaction = await tx.transaction.create({
              data: {
                type: TransactionType.REPAYMENT,
                refId: payment.id,
                amount: paymentAmount,
              },
            });

            // Link payment to transaction
            await tx.payment.update({
              where: { id: payment.id },
              data: { transactionId: transaction.id },
            });

            // Transfer money from user to platform
            await this.accountsService.transferFromBorrower(
              tx,
              loan.accountId,
              paymentAmount,
              `Repayment for installment ${repayment.installmentNumber}`,
            );

            // Mark repayment as PAID
            await tx.repaymentSchedule.update({
              where: { id: repayment.id },
              data: {
                status: RepaymentScheduleStatus.PAID,
                paidDate: paymentDate,
              },
            });

            payments.push(payment);
            transactions.push(transaction);
            totalPrincipalPaid += principalAmount;
            remainingAccruedInterest -= interestForThisRepayment;

            this.logger.logBusinessLogic(
              {
                service: 'payment',
                operation: 'processPayment',
                transactionId: paymentId,
              },
              'processRepayment',
              {
                installmentNumber: repayment.installmentNumber,
                principalPaid: principalAmount,
                interestPaid: interestForThisRepayment.toFixed(2),
                lateFeePaid: lateFee,
                totalAmount: paymentAmount.toFixed(2),
              },
            );
          }

          // ========================================
          // STEP 8: Handle Remaining Accrued Interest (Partial Payment)
          // ========================================
          if (remainingAccruedInterest > 0.01) {
            // Only if > 1 cent
            const nextRepayment = allPendingRepayments.find(
              (rep) => !dueRepayments.some((due) => due.id === rep.id),
            );

            if (nextRepayment) {
              // Create partial payment for next repayment
              const payment = await tx.payment.create({
                data: {
                  loanId: loan.id,
                  repaymentScheduleId: nextRepayment.id,
                  amount: remainingAccruedInterest,
                  paymentDate: paymentDate,
                  principalPaid: 0, // Only interest, no principal
                  interestPaid: remainingAccruedInterest,
                  lateFeePaid: 0,
                  daysLate: 0,
                  status: PaymentStatus.COMPLETED,
                },
              });

              const transaction = await tx.transaction.create({
                data: {
                  type: TransactionType.REPAYMENT,
                  refId: payment.id,
                  amount: remainingAccruedInterest,
                },
              });

              await tx.payment.update({
                where: { id: payment.id },
                data: { transactionId: transaction.id },
              });

              await this.accountsService.transferFromBorrower(
                tx,
                loan.accountId,
                remainingAccruedInterest,
                `Partial interest payment for installment ${nextRepayment.installmentNumber}`,
              );

              // Mark next repayment as PARTIALLY_PAID
              await tx.repaymentSchedule.update({
                where: { id: nextRepayment.id },
                data: { status: RepaymentScheduleStatus.PARTIALLY_PAID },
              });

              payments.push(payment);
              transactions.push(transaction);

              this.logger.logBusinessLogic(
                {
                  service: 'payment',
                  operation: 'processPayment',
                  transactionId: paymentId,
                },
                'partialPayment',
                {
                  installmentNumber: nextRepayment.installmentNumber,
                  remainingInterest: remainingAccruedInterest.toFixed(2),
                },
              );
            }
          }

          // ========================================
          // STEP 9: Update Loan Outstanding Principal
          // ========================================
          const newOutstanding = outstandingPrincipal - totalPrincipalPaid;
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
              totalPrincipalPaid,
              totalInterestPaid: totalAccruedInterest.toFixed(2),
              totalLateFee,
              schedulesCovered: dueRepayments.length,
              newOutstanding,
            },
          );

          return {
            payments,
            transactions,
            totalAmountCharged,
            totalPrincipalPaid,
            totalInterestPaid: totalAccruedInterest,
            totalLateFee,
            schedulesCovered: dueRepayments.length,
            newOutstandingPrincipal: newOutstanding,
          };
        },
      );
    } catch (error) {
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
