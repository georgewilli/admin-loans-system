import { IsString, IsNumber, IsPositive, IsInt } from 'class-validator';

export class CreateLoanDto {
  @IsString()
  accountId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  @IsPositive()
  interestRate: number; // percentage, e.g., 12.5

  @IsInt()
  @IsPositive()
  tenor: number; // in months
}
