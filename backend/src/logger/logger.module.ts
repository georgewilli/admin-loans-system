import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
