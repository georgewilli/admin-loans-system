import { Controller, Get, Post, Param, Query, Request, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RollbackService } from './rollback.service';
import { OperationType } from '@prisma/client';
import type { Response } from 'express';

@ApiTags('Rollbacks')
@Controller('rollback')
export class RollbackController {
  constructor(private rollbackService: RollbackService) { }

  // React Admin compatible endpoint for list view
  @Get()
  @ApiOperation({ summary: 'Get rollback records', description: 'Retrieve rollback history with optional filtering' })
  @ApiQuery({ name: 'operation', required: false, enum: OperationType, description: 'Filter by operation type' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Rollback records retrieved successfully' })
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
  @ApiOperation({ summary: 'Rollback disbursement', description: 'Reverse a disbursement transaction (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Disbursement ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Error in processing' } } } })
  @ApiResponse({ status: 201, description: 'Disbursement rolled back successfully' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
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
  @ApiOperation({ summary: 'Rollback payment', description: 'Reverse a payment transaction (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Payment ID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Payment error' } } } })
  @ApiResponse({ status: 201, description: 'Payment rolled back successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
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
