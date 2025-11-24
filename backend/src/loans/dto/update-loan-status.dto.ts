import { LoanStatus } from '@prisma/client';
import { IsString, IsIn } from 'class-validator';

export class UpdateLoanStatusDto {
  @IsString()
  @IsIn([
    LoanStatus.PENDING,
    LoanStatus.APPROVED,
    LoanStatus.ACTIVE,
    LoanStatus.CLOSED,
  ])
  status: LoanStatus;
}
