import { LoanStatus } from '@prisma/client';
import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoanStatusDto {
  @ApiProperty({
    description: 'New loan status',
    enum: LoanStatus,
    example: LoanStatus.APPROVED,
  })
  @IsString()
  @IsIn([
    LoanStatus.PENDING,
    LoanStatus.APPROVED,
    LoanStatus.ACTIVE,
    LoanStatus.CLOSED,
  ])
  status: LoanStatus;
}
