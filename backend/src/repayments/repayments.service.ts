import { Injectable, BadRequestException } from '@nestjs/common';
import { RepaymentsRepository } from './repayments.repository';
import { RepaymentScheduleBuilder } from './logic/repayments-scheduler.builder';
import { Loan, Prisma } from '@prisma/client';

@Injectable()
export class RepaymentsService {
  constructor(private repaymentsRepository: RepaymentsRepository) {}

  // Read methods for viewing
  async findAll() {
    return this.repaymentsRepository.findAll();
  }

  async findOne(id: string) {
    const schedule = await this.repaymentsRepository.findById(id);
    if (!schedule)
      throw new BadRequestException('Repayment schedule not found');
    return schedule;
  }

  async findByLoan(loanId: string) {
    return this.repaymentsRepository.findByLoanId(loanId);
  }

  // Business logic methods for other modules
  async createSchedulesForLoan(
    loan: Loan,
    disbursementDate: Date,
    tx: Prisma.TransactionClient,
  ) {
    const schedules = RepaymentScheduleBuilder.build(loan, disbursementDate);
    await this.repaymentsRepository.createMany(schedules, tx);
    return schedules;
  }

  async getNextPendingSchedule(loanId: string, tx?: Prisma.TransactionClient) {
    return this.repaymentsRepository.findNextPending(loanId, tx);
  }
}
