import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansRepository {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.loan.findMany({
      include: {
        disbursement: true,
        schedules: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.loan.findUnique({
      where: { id },
      include: {
        disbursement: true,
        schedules: true,
        payments: true,
      },
    });
  }

  async create(data: {
    accountId: string;
    amount: number;
    interestRate: number;
    tenor: number;
  }) {
    return this.prisma.loan.create({
      data: {
        accountId: data.accountId,
        amount: data.amount,
        interestRate: data.interestRate,
        tenor: data.tenor,
        status: LoanStatus.PENDING,
      },
    });
  }

  async updateStatus(id: string, status: LoanStatus) {
    return this.prisma.loan.update({
      where: { id },
      data: { status },
    });
  }

  async updateOutstandingPrincipal(id: string, outstandingPrincipal: number) {
    const status = outstandingPrincipal === 0 ? LoanStatus.CLOSED : undefined;

    return this.prisma.loan.update({
      where: { id },
      data: {
        outstandingPrincipal,
        ...(status && { status }),
      },
    });
  }
}
