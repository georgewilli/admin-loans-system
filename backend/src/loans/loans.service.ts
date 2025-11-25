import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loans.dto';
import { LoansRepository } from './loans.repository';
import { LoanStatus, AuditEventType } from '@prisma/client';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction } from 'src/audit/interfaces/audit-event.interface';

@Injectable()
export class LoansService {
  constructor(
    private loansRepository: LoansRepository,
    private auditService: AuditService,
  ) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    return this.loansRepository.findAll(params);
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

    // Log loan creation event
    await this.auditService.logDataChange({
      eventType: AuditEventType.LOAN_CREATED,
      action: AuditAction.CREATE,
      resource: 'Loan',
      resourceId: loan.id,
      oldValues: null,
      newValues: {
        id: loan.id,
        accountId: loan.accountId,
        amount: loan.amount.toString(),
        interestRate: loan.interestRate.toString(),
        tenor: loan.tenor,
        status: loan.status,
      },
      metadata: {
        accountId: loan.accountId,
        amount: Number(loan.amount),
      },
    });

    return { loan };
  }

  async updateLoanStatus(id: string, status: LoanStatus) {
    const loan = await this.loansRepository.findById(id);
    if (!loan) throw new BadRequestException('Loan not found');

    // Capture old status
    const oldStatus = loan.status;

    // Update the loan
    const updatedLoan = await this.loansRepository.updateStatus(id, status);

    // Determine event type based on new status
    let eventType: AuditEventType;
    if (status === LoanStatus.APPROVED) {
      eventType = AuditEventType.LOAN_APPROVED;
    } else if (status === LoanStatus.CLOSED) {
      eventType = AuditEventType.LOAN_CLOSED;
    } else {
      eventType = AuditEventType.LOAN_UPDATED;
    }

    // Log status change with before/after values
    await this.auditService.logDataChange({
      eventType,
      action: AuditAction.UPDATE,
      resource: 'Loan',
      resourceId: id,
      oldValues: { status: oldStatus },
      newValues: { status: status },
      metadata: {
        accountId: loan.accountId,
        amount: Number(loan.amount),
        statusChange: `${oldStatus} → ${status}`,
      },
    });

    return updatedLoan;
  }
}
