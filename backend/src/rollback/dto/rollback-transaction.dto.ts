import { IsString, IsNotEmpty } from 'class-validator';

export class RollbackTransactionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  userId?: string;
}
