import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaTransactionalClient } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  create(createTransactionDto: CreateTransactionDto) {
    return 'This action adds a new transaction';
  }

  findAll() {
    return `This action returns all transactions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, _updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }

  async getAvailableFunds(tx: PrismaTransactionalClient) {
    const grouped = await tx.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });

    let inflow = 0;
    let outflow = 0;

    for (const row of grouped) {
      const sum = Number(row._sum.amount ?? 0);

      if (row.type === 'DISBURSEMENT') {
        outflow += sum;
      } else {
        // FUNDING, REPAYMENT, etc.
        inflow += sum;
      }
    }

    return inflow - outflow;
  }
}
