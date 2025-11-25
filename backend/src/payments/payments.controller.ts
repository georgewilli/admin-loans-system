import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all payments', description: 'Retrieve all payment records (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get payment by ID', description: 'Retrieve specific payment details (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Process payment',
    description: 'Process a loan payment with waterfall allocation (Interest → Fees → Principal). Supports partial payments (Admin only)'
  })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data or loan not active' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async makePayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.processPayment(dto);
  }
}
