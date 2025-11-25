import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { DisbursementsRepository } from './disbursements.repository';
import { RepaymentsService } from 'src/repayments/repayments.service';
import { RollbackService } from 'src/rollback/rollback.service';
import { TransactionWrapper } from 'src/rollback/helpers/transaction-wrapper.helper';
import { AccountsService } from 'src/accounts/accounts.service';
import {
  AccountType,
  LoanStatus,
  DisbursementStatus,
  TransactionType,
  TransactionStatus,
  OperationType,
} from '@prisma/client';
import { LoggerService } from 'src/logger/logger.service';
import { DISBURSEMENT_CONSTANTS } from 'src/constants';

@Injectable()
export class DisbursementsService {
  constructor(
    private prismaService: PrismaService,
    private transactionService: TransactionsService,
    private disbursementsRepository: DisbursementsRepository,
    private repaymentsService: RepaymentsService,
    private rollbackService: RollbackService,
    private accountsService: AccountsService,
    private logger: LoggerService,
  ) { }

  async findAll() {
    return this.disbursementsRepository.findAll();
  }

  async findOne(id: string) {
    const disbursement = await this.disbursementsRepository.findById(id);
    if (!disbursement) throw new BadRequestException('Disbursement not found');
    return disbursement;
  }

  async disburseLoan(loanId: string, dto: CreateDisbursementDto) {
    const startTime = Date.now();

    // 0) Load loan and enforce basic rules
    const loan = await this.prismaService.loan.findUnique({
      where: { id: loanId },
    });
    if (!loan) throw new BadRequestException('Loan not found');

    const existing = await this.prismaService.disbursement.findUnique({
      where: { loanId },
    });
    if (existing) {
      // Disbursement already exists - provide specific error based on status
      if (existing.status === DisbursementStatus.COMPLETED) {
        throw new BadRequestException('Loan already disbursed successfully');
      } else if (existing.status === DisbursementStatus.FAILED) {
        throw new BadRequestException(
          'Previous disbursement failed. Cannot retry.',
        );
      } else if (existing.status === DisbursementStatus.PENDING) {
        throw new BadRequestException('Disbursement is already pending');
      } else {
        throw new BadRequestException(
          `Disbursement already exists with status: ${existing.status}`,
        );
      }
    }

    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException(
        'Loan must be APPROVED before disbursement',
      );
    }

    if (Number(dto.amount) !== Number(loan.amount)) {
      throw new BadRequestException(
        'Disbursement amount must equal loan amount',
      );
    }

    const disbursementDate = dto.disbursementDate
      ? new Date(dto.disbursementDate)
      : new Date();

    // Create disbursement with status 'pending'
    let disbursement;
    try {
      disbursement = await this.prismaService.disbursement.create({
        data: {
          loanId,
          amount: dto.amount,
          disbursementDate,
          status: DisbursementStatus.PENDING,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Disbursement already exists for this loan');
      }
      throw error;
    }

    // LOG: Transaction Start
    this.logger.logTransactionStart({
      service: 'disbursement',
      operation: 'disburseLoan',
      transactionId: disbursement.id,
      userId: loan.accountId, // Using accountId as userId proxy
      metadata: {
        loanId,
        amount: Number(dto.amount),
        accountId: loan.accountId,
      },
    });

    try {
      // Use TransactionWrapper for automatic rollback logging
      const wrappedResult = await TransactionWrapper.executeWithRollbackLogging(
        this.prismaService,
        this.rollbackService,
        OperationType.DISBURSEMENT,
        async (tx) => {
          // LOG: Idempotency Check
          this.logger.debug({
            service: 'disbursement',
            operation: 'checkIdempotency',
            transactionId: disbursement.id,
            metadata: {
              prismaQuery: 'findUnique on disbursements',
            },
          });

          // 2a) Check available platform funds
          const fundsCheckStart = Date.now();
          const availableFunds =
            await this.transactionService.getAvailableFunds(tx);
          const disbursementAmount = Number(dto.amount);

          // LOG: Funds check query
          this.logger.logQuery(
            {
              service: 'disbursement',
              operation: 'checkAvailableFunds',
              transactionId: disbursement.id,
            },
            'getAvailableFunds',
            Date.now() - fundsCheckStart,
            {
              availableFunds,
              required: disbursementAmount,
            },
          );

          // Validate sufficient funds exist
          if (availableFunds < disbursementAmount) {
            throw new BadRequestException(
              `Insufficient platform funds. Available: ${availableFunds}, Required: ${disbursementAmount}`,
            );
          }

          // 2b) Create platform transaction (money going OUT)
          const transaction = await tx.transaction.create({
            data: {
              type: TransactionType.DISBURSEMENT,
              refId: disbursement.id,
              amount: -disbursementAmount, // negative: platform pays out
              status: TransactionStatus.COMPLETED,
            },
          });

          // TEST ONLY: Error injection for rollback testing
          // Set TEST_INJECT_ERROR=DISBURSEMENT environment variable to trigger

          // 2d) Transfer from platform to user (disbursement)
          await this.accountsService.transferToBorrower(
            tx,
            loan.accountId,
            disbursementAmount,
            'Loan disbursement',
          );

          // 2c) Update loan → ACTIVE + set outstandingPrincipal
          const updatedLoan = await tx.loan.update({
            where: { id: loanId },
            data: {
              status: LoanStatus.ACTIVE,
              outstandingPrincipal: loan.amount,
            },
          });

          // 2d) Generate and insert repayment schedule via RepaymentsService
          // LOG: Schedule Generation
          this.logger.logBusinessLogic(
            {
              service: 'disbursement',
              operation: 'disburseLoan',
              transactionId: disbursement.id,
            },
            'generateRepaymentSchedule',
            {
              tenor: loan.tenor,
              firstPaymentDate: new Date(
                disbursementDate.getTime() +
                DISBURSEMENT_CONSTANTS.DAYS_UNTIL_FIRST_PAYMENT *
                DISBURSEMENT_CONSTANTS.MILLISECONDS_PER_DAY,
              )
                .toISOString()
                .split('T')[0],
            },
          );

          const schedules = await this.repaymentsService.createSchedulesForLoan(
            updatedLoan,
            disbursementDate,
            tx,
          );

          // LOG: Calculated schedule details
          this.logger.info(
            {
              service: 'disbursement',
              operation: 'disburseLoan',
              transactionId: disbursement.id,
            },
            {
              schedulesCreated: schedules.length,
              totalInterest: schedules.reduce(
                (sum, s) => sum + Number(s.interestAmount),
                0,
              ),
            },
          );

          return { transaction, updatedLoan, schedules };
        },
      );

      // Extract results from wrapped transaction
      const { updatedLoan, schedules } = wrappedResult;

      // 3) Post-commit operations - wrap in try-catch for explicit rollback handling
      try {
        // Mark disbursement completed
        const finalDisbursement = await this.prismaService.disbursement.update({
          where: { id: disbursement.id },
          data: { status: DisbursementStatus.COMPLETED },
        });

        // LOG: Enhanced audit - Disbursement completed
        await this.accountsService['auditService']?.logBusinessEvent({
          eventType: 'DISBURSEMENT_COMPLETED' as any,
          resource: 'Disbursement',
          resourceId: disbursement.id,
          userId: loan.accountId,
          transactionId: disbursement.id,
          success: true,
          metadata: {
            loanId,
            amount: Number(dto.amount),
            oldStatus: DisbursementStatus.PENDING,
            newStatus: DisbursementStatus.COMPLETED,
            scheduleCount: schedules.length,
          },
        }).catch(err => {
          this.logger.error(
            {
              service: 'disbursement',
              operation: 'logAuditEvent',
              transactionId: disbursement.id,
            },
            new Error(`Audit logging failed: ${err.message}`)
          );
        });

        // LOG: Transaction End
        const totalDuration = Date.now() - startTime;
        this.logger.logTransactionEnd(
          {
            service: 'disbursement',
            operation: 'disburseLoan',
            transactionId: disbursement.id,
            userId: loan.accountId,
          },
          totalDuration,
          {
            status: 'completed',
            scheduleCount: schedules.length,
          },
        );

        // TEST ONLY: Error injection for testing post-commit rollback
        if (process.env.TEST_INJECT_ERROR === 'DISBURSEMENT') {
          throw new Error(
            'TEST: Simulated post-commit failure in disbursement',
          );
        }

        return {
          message: 'Loan disbursed successfully',
          disbursement: finalDisbursement,
          loan: updatedLoan,
          scheduleCount: schedules.length,
        };
      } catch (postCommitError: any) {
        // Post-commit failure: transaction succeeded but error occurred after
        // Need to manually rollback the disbursement
        this.logger.error(
          {
            service: 'disbursement',
            operation: 'disburseLoan',
            transactionId: disbursement.id,
            userId: loan.accountId,
          },
          postCommitError,
        );

        // Trigger rollback to reverse the account transfers
        await this.rollbackService.rollbackDisbursement(
          disbursement.id,
          'SYSTEM_AUTO',
          `System rollback due to post-commit error: ${postCommitError.message}`,
        );

        throw new Error(
          `Disbursement failed after transaction commit and was rolled back: ${postCommitError.message}`,
        );
      }
    } catch (error: any) {
      // LOG: Error with full context
      const totalDuration = Date.now() - startTime;
      this.logger.error(
        {
          service: 'disbursement',
          operation: 'disburseLoan',
          transactionId: disbursement?.id,
          userId: loan?.accountId,
          metadata: {
            loanId,
            amount: Number(dto.amount),
            duration: totalDuration,
          },
        },
        error,
      );

      // 4) Mark disbursement as failed if anything inside transaction broke
      await this.prismaService.disbursement.update({
        where: { id: disbursement.id },
        data: { status: DisbursementStatus.FAILED },
      });

      throw error;
    }
  }
}
