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
import { RepaymentCalculationService } from './services/repayment-calculation.service';
import { PaymentAllocationService } from './services/payment-allocation.service';
import { PaymentDataService } from './services/payment-data.service';
import { PaymentPersistenceService } from './services/payment-persistence.service';
import { TotalDueCalculatorService } from './services/total-due-calculator.service';

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
    RepaymentCalculationService,
    PaymentAllocationService,
    PaymentDataService,
    PaymentPersistenceService,
    TotalDueCalculatorService,
  ],
})
export class PaymentsModule {}
