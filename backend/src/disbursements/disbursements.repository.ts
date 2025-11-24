import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisbursementStatus, Prisma } from '@prisma/client';

@Injectable()
export class DisbursementsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.disbursement.findMany({
      include: {
        loan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.disbursement.findUnique({
      where: { id },
      include: {
        loan: true,
        transaction: true,
      },
    });
  }

  async findByLoanId(loanId: string) {
    return this.prisma.disbursement.findUnique({
      where: { loanId },
    });
  }

  async create(data: Prisma.DisbursementCreateInput) {
    return this.prisma.disbursement.create({
      data,
    });
  }

  async updateStatus(id: string, status: DisbursementStatus) {
    return this.prisma.disbursement.update({
      where: { id },
      data: { status },
    });
  }
}
