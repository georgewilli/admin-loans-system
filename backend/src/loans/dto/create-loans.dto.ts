import { IsString, IsNumber, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({
    description: 'ID of the account to create the loan for',
    example: 'acc-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Loan amount in USD',
    example: 10000,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Annual interest rate as a percentage',
    example: 12.5,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  interestRate: number; // percentage, e.g., 12.5

  @ApiProperty({
    description: 'Loan tenor (duration) in months',
    example: 12,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  tenor: number; // in months
}
