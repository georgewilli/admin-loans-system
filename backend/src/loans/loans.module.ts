import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoansRepository } from './loans.repository';
import { AuditService } from 'src/audit/audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoansController],
  providers: [LoansService, LoansRepository, AuditService],
  exports: [LoansService, LoansRepository],
})
export class LoansModule { }
