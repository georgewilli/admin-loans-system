import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('disbursements')
@UseGuards(JwtAuthGuard)
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) {}

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
  async disburseLoan(
    @Param('id') loanId: string,
    @Body() dto: CreateDisbursementDto,
  ) {
    return this.disbursementsService.disburseLoan(loanId, dto);
  }
}
