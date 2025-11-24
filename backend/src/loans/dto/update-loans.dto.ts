import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanDto } from './create-loans.dto';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {}
