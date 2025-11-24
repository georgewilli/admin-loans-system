import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, AccountType } from '@prisma/client';

@Injectable()
export class AccountsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.account.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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

  async findWithUser(accountId: string) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        loans: {
          include: {
            disbursement: true,
            payments: true,
          },
        },
      },
    });
  }
}
