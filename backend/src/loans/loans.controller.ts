import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Get,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { CreateLoanDto } from './dto/create-loans.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  async findAll() {
    return this.loansService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  async createLoan(@Body() dto: CreateLoanDto) {
    return this.loansService.createLoan(dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLoanStatusDto,
  ) {
    return this.loansService.updateLoanStatus(id, dto.status);
  }
}
