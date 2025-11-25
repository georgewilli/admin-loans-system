import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Disbursements')
@ApiBearerAuth('JWT-auth')
@Controller('disbursements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) { }


  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all disbursements', description: 'Retrieve all disbursement records (Admin only)' })
  @ApiResponse({ status: 200, description: 'Disbursements retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  findAll() {
    return this.disbursementsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get disbursement by ID', description: 'Retrieve specific disbursement details' })
  @ApiParam({ name: 'id', type: String, description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement found' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  findOne(@Param('id') id: string) {
    return this.disbursementsService.findOne(id);
  }

  @Post(':id/disburse')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Disburse loan',
    description: 'Transfer funds from platform account to borrower account (Admin only)'
  })
  @ApiParam({ name: 'id', type: String, description: 'Loan ID' })
  @ApiResponse({ status: 201, description: 'Loan disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or loan already disbursed' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async disburseLoan(
    @Param('id') loanId: string,
    @Body() dto: CreateDisbursementDto,
  ) {
    return this.disbursementsService.disburseLoan(loanId, dto);
  }
}
