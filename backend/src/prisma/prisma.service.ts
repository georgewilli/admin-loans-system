import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    (this as any).$on('query', (e: Prisma.QueryEvent) => {
      const timing = e.duration;
      const sql = e.query;

      // If you uncomment this line, please make sure to comment it back before pushing.
      // this.logger.verbose({ sql, timing });

      let isSlow = false;
      if (timing > 300 && timing < 1000) {
        isSlow = true;
        this.logger.warn({
          message: `Slow query: took ${timing}ms: ${sql} `,
        });
      } else if (timing > 1000) {
        isSlow = true;

        this.logger.error({
          message: `Super Slow query took ${timing}ms: ${sql} `,
        });
      }

    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

export type PrismaTransactionalClient = Prisma.TransactionClient;
