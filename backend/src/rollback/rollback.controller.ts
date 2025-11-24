import { Controller, Get, Post, Param, Query, Request } from '@nestjs/common';
import { RollbackService } from './rollback.service';

@Controller('rollback')
export class RollbackController {
  constructor(private rollbackService: RollbackService) {}

  // React Admin compatible endpoint for list view
  @Get()
  async getRollbacks(
    @Query('operation') operation?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const records = await this.rollbackService.getRollbackRecords({
      operation,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    // React Admin expects data and total properties
    return records;
  }

  @Get('records')
  async getRollbackRecords(
    @Query('operation') operation?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.rollbackService.getRollbackRecords({
      operation,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Post('disbursement/:id')
  async rollbackDisbursement(@Param('id') id: string, @Request() req: any) {
    const adminUserId = req.user?.id || 'ADMIN';
    await this.rollbackService.rollbackDisbursement(id, adminUserId);
    return {
      message: 'Disbursement rolled back successfully',
      disbursementId: id,
    };
  }

  @Post('payment/:id')
  async rollbackPayment(@Param('id') id: string, @Request() req: any) {
    const adminUserId = req.user?.id || 'ADMIN';
    await this.rollbackService.rollbackPayment(id, adminUserId);
    return { message: 'Payment rolled back successfully', paymentId: id };
  }
}
