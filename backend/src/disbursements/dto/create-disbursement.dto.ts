import { IsNumber, IsPositive, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDisbursementDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsDateString()
  disbursementDate?: string; // ISO date

  @IsOptional()
  @IsString()
  status?: string; // default = 'DISBURSED'
}
