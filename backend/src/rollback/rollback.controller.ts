import { Controller, Get, Post, Param, Query, Request, Body, Res } from '@nestjs/common';
import { RollbackService } from './rollback.service';
import { OperationType } from '@prisma/client';
import type { Response } from 'express';

@Controller('rollback')
export class RollbackController {
  constructor(private rollbackService: RollbackService) { }

  // React Admin compatible endpoint for list view
  @Get()
  async getRollbacks(
    @Query('operation') operation: OperationType,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Res() res: Response,
  ) {
    const records = await this.rollbackService.getRollbackRecords({
      operation,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    // React Admin expects data and total properties or Content-Range header
    res.set('Content-Range', `rollback ${0}-${records.length}/${records.length}`);
    return res.json(records);
  }

  @Get('records')
  async getRollbackRecords(
    @Query('operation') operation?: OperationType,
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
  async rollbackDisbursement(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const adminUserId = (req.user?.id as string) || 'ADMIN';
    await this.rollbackService.rollbackDisbursement(id, adminUserId, reason);
    return {
      message: 'Disbursement rolled back successfully',
      disbursementId: id,
    };
  }

  @Post('payment/:id')
  async rollbackPayment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const adminUserId = (req.user?.id as string) || 'ADMIN';
    await this.rollbackService.rollbackPayment(id, adminUserId, reason);
    return { message: 'Payment rolled back successfully', paymentId: id };
  }
}
