import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        loan: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        loan: true,
        transaction: true,
      },
    });
  }

  async findByLoanId(loanId: string) {
    return this.prisma.payment.findMany({
      where: { loanId },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findLastPayment(loanId: string) {
    return this.prisma.payment.findFirst({
      where: { loanId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
    });
  }

  async update(id: string, data: { transactionId?: string }) {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }
}
