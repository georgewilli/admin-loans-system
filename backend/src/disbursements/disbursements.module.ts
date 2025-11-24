import { Module } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { DisbursementsController } from './disbursements.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { DisbursementsRepository } from './disbursements.repository';
import { LoansModule } from 'src/loans/loans.module';
import { RepaymentsModule } from 'src/repayments/repayments.module';
import { RollbackModule } from 'src/rollback/rollback.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [
    PrismaModule,
    TransactionsModule,
    LoansModule,
    RepaymentsModule,
    RollbackModule,
    AccountsModule,
  ],
  controllers: [DisbursementsController],
  providers: [DisbursementsService, DisbursementsRepository],
})
export class DisbursementsModule {}
