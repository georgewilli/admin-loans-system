import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansRepository {
  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const skip = params?.skip ?? 0;
    const take = Math.min(params?.take ?? 50, 100); // Max 100 per page

    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        skip,
        take,
        where: params?.where,
        orderBy: params?.orderBy || { createdAt: 'desc' },
        include: {
          disbursement: true,
          account: {
            select: {
              id: true,
              balance: true,
              type: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          // Removed schedules - causes N+1 query problem
          // Fetch schedules only in findById when needed
        },
      }),
      this.prisma.loan.count({ where: params?.where }),
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
    return this.prisma.loan.findUnique({
      where: { id },
      include: {
        disbursement: true,
        account: {
          select: {
            id: true,
            balance: true,
            type: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        schedules: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: {
          take: 10, // Only recent 10 payments
          orderBy: { paymentDate: 'desc' },
        },
        _count: {
          select: {
            schedules: true,
            payments: true,
          },
        },
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
