import { Injectable } from '@nestjs/common';
import { PrismaTransactionalClient } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  /**
   * Calculate available funds by summing all transaction amounts
   * 
   * Transaction amounts are:
   * - Positive for inflows (REPAYMENT, ADDING_FUNDS)
   * - Negative for outflows (DISBURSEMENT)
   * 
   * Available funds = Total Inflows - Total Outflows
   */
  async getAvailableFunds(tx: PrismaTransactionalClient): Promise<number> {
    const transactionsByType = await tx.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    for (const group of transactionsByType) {
      const amount = Number(group._sum.amount ?? 0);

      if (group.type === 'DISBURSEMENT') {
        // Disbursements are stored as negative amounts (money going out)
        totalOutflow += amount;
      } else {
        // Repayments and funding are positive (money coming in)
        totalInflow += amount;
      }
    }

    return totalInflow - totalOutflow;
  }
}
