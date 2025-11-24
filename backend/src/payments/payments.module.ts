import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentsRepository } from './payments.repository';
import { LoansModule } from 'src/loans/loans.module';
import { RepaymentsModule } from 'src/repayments/repayments.module';
import { RollbackModule } from 'src/rollback/rollback.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoansModule,
    RepaymentsModule,
    RollbackModule,
    AccountsModule,
    LoggerModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
  ],
})
export class PaymentsModule { }
