import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepaymentScheduleStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class RepaymentsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.repaymentSchedule.findMany({
      include: {
        loan: true,
      },
      orderBy: [{ loanId: 'asc' }, { installmentNumber: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.repaymentSchedule.findUnique({
      where: { id },
      include: {
        loan: true,
      },
    });
  }

  async findByLoanId(loanId: string) {
    return this.prisma.repaymentSchedule.findMany({
      where: { loanId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async findNextPending(loanId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    return client.repaymentSchedule.findFirst({
      where: { loanId, status: RepaymentScheduleStatus.PENDING },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  async createMany(
    data: Prisma.RepaymentScheduleCreateManyInput[],
    tx: Prisma.TransactionClient,
  ) {
    return tx.repaymentSchedule.createMany({
      data,
    });
  }
}
