import { IsDateString, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  loanId: string;

  @IsDateString()
  paymentDate: string; // ISO string

  @IsNumber()
  @IsOptional()
  amount?: number; // Optional: if provided, use this amount. If not, calculate full due.
}
