import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loans.dto';
import { LoansRepository } from './loans.repository';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(private loansRepository: LoansRepository) {}

  async findAll() {
    return this.loansRepository.findAll();
  }

  async findOne(id: string) {
    const loan = await this.loansRepository.findById(id);
    if (!loan) throw new BadRequestException('Loan not found');
    return loan;
  }

  async createLoan(dto: CreateLoanDto) {
    const loan = await this.loansRepository.create({
      accountId: dto.accountId,
      amount: dto.amount,
      interestRate: dto.interestRate,
      tenor: dto.tenor,
    });

    return { loan };
  }

  async updateLoanStatus(id: string, status: LoanStatus) {
    const loan = await this.loansRepository.findById(id);
    if (!loan) throw new BadRequestException('Loan not found');

    return this.loansRepository.updateStatus(id, status);
  }
}
