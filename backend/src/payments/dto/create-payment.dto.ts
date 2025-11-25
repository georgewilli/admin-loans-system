import { IsDateString, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID of the loan to make payment for',
    example: 'loan-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  loanId: string;

  @ApiProperty({
    description: 'Payment date in ISO 8601 format',
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsDateString()
  paymentDate: string; // ISO string

  @ApiPropertyOptional({
    description: 'Payment amount. If not provided, system will calculate full amount due',
    example: 1000,
    minimum: 0.01,
  })
  @IsNumber()
  @IsOptional()
  amount?: number; // Optional: if provided, use this amount. If not, calculate full due.
}
