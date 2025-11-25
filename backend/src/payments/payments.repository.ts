import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const skip = params?.skip ?? 0;
    const take = Math.min(params?.take ?? 50, 100);

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take,
        where: params?.where,
        orderBy: params?.orderBy || { paymentDate: 'desc' },
        // Use select instead of include for better performance
        select: {
          id: true,
          loanId: true,
          amount: true,
          paymentDate: true,
          principalPaid: true,
          interestPaid: true,
          lateFeePaid: true,
          daysLate: true,
          status: true,
          createdAt: true,
          // Only fetch essential loan fields
          loan: {
            select: {
              id: true,
              amount: true,
              status: true,
              outstandingPrincipal: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where: params?.where }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        loan: true,
        transaction: true,
        repaymentSchedule: true,
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
