import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RepaymentsService } from './repayments.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('repayments')
@UseGuards(JwtAuthGuard)
export class RepaymentsController {
  constructor(private readonly repaymentsService: RepaymentsService) {}

  @Get()
  findAll() {
    return this.repaymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repaymentsService.findOne(id);
  }
}
