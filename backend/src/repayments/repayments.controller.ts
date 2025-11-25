import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RepaymentsService } from './repayments.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@ApiTags('Repayment Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('repayments')
@UseGuards(JwtAuthGuard)
export class RepaymentsController {
  constructor(private readonly repaymentsService: RepaymentsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all repayment schedules', description: 'Retrieve all repayment schedule records' })
  @ApiResponse({ status: 200, description: 'Repayment schedules retrieved successfully' })
  findAll() {
    return this.repaymentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repayment schedule by ID', description: 'Retrieve specific repayment schedule details' })
  @ApiParam({ name: 'id', type: String, description: 'Repayment Schedule ID' })
  @ApiResponse({ status: 200, description: 'Repayment schedule found' })
  @ApiResponse({ status: 404, description: 'Repayment schedule not found' })
  findOne(@Param('id') id: string) {
    return this.repaymentsService.findOne(id);
  }
}
