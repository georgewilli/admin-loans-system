import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';

import { PrismaTransactionalClient } from 'src/prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private accountsRepository: AccountsRepository) { }

  async getAllAccounts() {
    return this.accountsRepository.findAll();
  }

  async getAccountByUserId(userId: string) {
    const account = await this.accountsRepository.findByUserId(userId);

    if (!account) {
      throw new NotFoundException(`Account not found for user ${userId}`);
    }

    return account;
  }

  async getAccountBalance(accountId: string): Promise<number> {
    return this.accountsRepository.getBalance(accountId);
  }

  async getAccountWithDetails(accountId: string) {
    const account = await this.accountsRepository.findWithUser(accountId);

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    return account;
  }

  async getPlatformAccount() {
    return this.accountsRepository.findPlatformAccount();
  }

  /**
   * Transfer funds from platform to borrower (Disbursement)
   * @param tx Prisma transaction client
   * @param borrowerAccountId The borrower's account ID
   * @param amount Amount to transfer
   * @param description Transfer description
   */
  async transferToBorrower(
    tx: PrismaTransactionalClient,
    borrowerAccountId: string,
    amount: number,
    description?: string,
  ): Promise<void> {
    // Get platform account
    const platformAccount = await tx.account.findFirst({
      where: { type: 'PLATFORM' },
    });

    if (!platformAccount) {
      throw new Error('Platform account not found');
    }

    // Transfer from platform to borrower
    await this.transferFunds(tx, {
      fromAccountId: platformAccount.id,
      toAccountId: borrowerAccountId,
      amount,
      description,
      skipBalanceCheck: true, // Platform can go negative
    });
  }

  /**
   * Transfer funds from borrower to platform (Repayment)
   * @param tx Prisma transaction client
   * @param borrowerAccountId The borrower's account ID
   * @param amount Amount to transfer
   * @param description Transfer description
   */
  async transferFromBorrower(
    tx: PrismaTransactionalClient,
    borrowerAccountId: string,
    amount: number,
    description?: string,
  ): Promise<void> {
    // Get platform account
    const platformAccount = await tx.account.findFirst({
      where: { type: 'PLATFORM' },
    });

    if (!platformAccount) {
      throw new Error('Platform account not found');
    }

    // Transfer from borrower to platform
    await this.transferFunds(tx, {
      fromAccountId: borrowerAccountId,
      toAccountId: platformAccount.id,
      amount,
      description,
      skipBalanceCheck: false, // Borrower must have sufficient balance
    });
  }

  /**
   * Transfer funds between two accounts atomically (shared validation logic)
   * @param tx Prisma transaction client
   * @param params Transfer parameters
   */
  async transferFunds(
    tx: PrismaTransactionalClient,
    params: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
      skipBalanceCheck?: boolean;
    },
  ): Promise<void> {
    const {
      fromAccountId,
      toAccountId,
      amount,
      skipBalanceCheck = false,
    } = params;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    // Get both accounts
    const [fromAccount, toAccount] = await Promise.all([
      tx.account.findUnique({ where: { id: fromAccountId } }),
      tx.account.findUnique({ where: { id: toAccountId } }),
    ]);

    if (!fromAccount) {
      throw new NotFoundException(`Source account ${fromAccountId} not found`);
    }
    if (!toAccount) {
      throw new NotFoundException(
        `Destination account ${toAccountId} not found`,
      );
    }

    // Check sufficient balance (skip for platform account)
    if (!skipBalanceCheck) {
      const currentBalance = Number(fromAccount.balance);
      if (currentBalance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${currentBalance}, Required: ${amount}`,
        );
      }
    }

    // Perform transfer atomically
    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: amount } },
    });

    await tx.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: amount } },
    });
  }
}
