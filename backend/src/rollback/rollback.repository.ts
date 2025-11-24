import { Injectable } from '@nestjs/common';
import {
  PrismaService,
  PrismaTransactionalClient,
} from '../prisma/prisma.service';
import { RollbackRecord as PrismaRollbackRecord, Prisma } from '@prisma/client';

@Injectable()
export class RollbackRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a rollback record
   */
  async create(
    data: Prisma.RollbackRecordCreateInput,
    tx?: PrismaTransactionalClient,
  ): Promise<PrismaRollbackRecord> {
    const client = tx || this.prisma;
    return client.rollbackRecord.create({ data });
  }

  /**
   * Find rollback records with filters
   */
  async findMany(params: {
    where?: Prisma.RollbackRecordWhereInput;
    orderBy?: Prisma.RollbackRecordOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<PrismaRollbackRecord[]> {
    return this.prisma.rollbackRecord.findMany(params);
  }

  /**
   * Find a single rollback record by ID
   */
  async findUnique(id: string): Promise<PrismaRollbackRecord | null> {
    return this.prisma.rollbackRecord.findUnique({
      where: { id },
    });
  }

  /**
   * Find rollback records by transaction ID
   */
  async findByTransactionId(
    transactionId: string,
  ): Promise<PrismaRollbackRecord[]> {
    return this.prisma.rollbackRecord.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count rollback records
   */
  async count(where?: Prisma.RollbackRecordWhereInput): Promise<number> {
    return this.prisma.rollbackRecord.count({ where });
  }
}
