import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class CreateDisbursementDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  disbursementDate?: string; // ISO date

  @IsOptional()
  @IsString()
  status?: string; // default = 'DISBURSED'
}
