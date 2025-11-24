import { IsDateString, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  loanId: string;

  @IsDateString()
  paymentDate: string; // ISO string - backend calculates total due based on this date
}
