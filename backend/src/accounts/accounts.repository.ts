import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountType } from '@prisma/client';

@Injectable()
export class AccountsRepository {
  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const skip = params?.skip ?? 0;
    const take = Math.min(params?.take ?? 50, 100);

    // Don't filter by type - show all accounts including platform
    const whereClause = params?.where || {};

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: params?.orderBy || { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      this.prisma.account.count({ where: whereClause }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { userId },
    });
  }

  async findPlatformAccount(): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { type: AccountType.PLATFORM },
    });

    if (!account) {
      throw new Error('Platform account not found');
    }

    return account;
  }

  async getBalance(accountId: string): Promise<number> {
    const account = await this.findById(accountId);
    return account ? Number(account.balance) : 0;
  }

  async findWithUser(
    accountId: string,
    options?: {
      includeLoans?: boolean;
      loansLimit?: number;
      paymentsPerLoan?: number;
    },
  ) {
    const includeLoans = options?.includeLoans ?? true;
    const loansLimit = options?.loansLimit ?? 10;
    const paymentsPerLoan = options?.paymentsPerLoan ?? 5;

    return this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        ...(includeLoans && {
          loans: {
            take: loansLimit,
            orderBy: { createdAt: 'desc' },
            include: {
              disbursement: true,
              payments: {
                take: paymentsPerLoan,
                orderBy: { paymentDate: 'desc' },
              },
              _count: {
                select: {
                  payments: true,
                  schedules: true,
                },
              },
            },
          },
        }),
        _count: {
          select: {
            loans: true,
          },
        },
      },
    });
  }
}
