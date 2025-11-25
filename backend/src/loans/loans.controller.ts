import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateLoanDto } from './dto/create-loans.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';

@ApiTags('Loans')
@ApiBearerAuth('JWT-auth')
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) { }

  @Get()
  @ApiOperation({ summary: 'Get all loans', description: 'Retrieve paginated list of all loans with account details' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50, description: 'Items per page (max 100)' })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.loansService.findAll({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan by ID', description: 'Retrieve detailed information about a specific loan' })
  @ApiParam({ name: 'id', type: String, description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Loan found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new loan', description: 'Create a new loan application (any authenticated user)' })
  @ApiResponse({ status: 201, description: 'Loan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid loan data' })
  async createLoan(@Body() dto: CreateLoanDto) {
    return this.loansService.createLoan(dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update loan status', description: 'Change loan status (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Loan status updated' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLoanStatusDto,
  ) {
    return this.loansService.updateLoanStatus(id, dto.status);
  }
}
