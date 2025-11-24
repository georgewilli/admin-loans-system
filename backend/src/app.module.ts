import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoansModule } from './loans/loans.module';
import { RepaymentsModule } from './repayments/repayments.module';
import { RollbackModule } from './rollback/rollback.module';
import { AuditModule } from './audit/audit.module';
import { DisbursementsModule } from './disbursements/disbursements.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    AuthModule,
    LoansModule,
    RepaymentsModule,
    RollbackModule,
    AuditModule,
    DisbursementsModule,
    PaymentsModule,
    TransactionsModule,
    AccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
