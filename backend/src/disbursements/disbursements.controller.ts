import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('disbursements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) { }

  // @Post()
  // create(@Body() createDisbursementDto: CreateDisbursementDto) {
  //   return this.disbursementsService.create(createDisbursementDto);
  // }

  @Get()
  findAll() {
    return this.disbursementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disbursementsService.findOne(id);
  }

  @Post(':id/disburse')
  @Roles(Role.ADMIN)
  async disburseLoan(
    @Param('id') loanId: string,
    @Body() dto: CreateDisbursementDto,
  ) {
    return this.disbursementsService.disburseLoan(loanId, dto);
  }
}
