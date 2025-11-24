import { Module } from '@nestjs/common';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RepaymentsRepository } from './repayments.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RepaymentsController],
  providers: [RepaymentsService, RepaymentsRepository],
  exports: [RepaymentsService],
})
export class RepaymentsModule {}
