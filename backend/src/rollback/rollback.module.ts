import { Module } from '@nestjs/common';
import { RollbackService } from './rollback.service';
import { RollbackController } from './rollback.controller';
import { RollbackRepository } from './rollback.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from 'src/audit/audit.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [PrismaModule, AuditModule, AccountsModule],
  controllers: [RollbackController],
  providers: [RollbackService, RollbackRepository],
  exports: [RollbackService, RollbackRepository],
})
export class RollbackModule {}
