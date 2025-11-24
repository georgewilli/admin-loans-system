import type { Loan } from '@prisma/client';
import { Prisma, RepaymentScheduleStatus } from '@prisma/client';
import { AmortizationCalculator } from 'src/loans/logic/amortization-calculator';

export class RepaymentScheduleBuilder {
  static build(
    loan: Loan,
    startDate: Date,
  ): Prisma.RepaymentScheduleCreateManyInput[] {
    const schedules: Prisma.RepaymentScheduleCreateManyInput[] = [];

    const principal = Number(loan.amount);
    const annualRate = Number(loan.interestRate);
    const tenor = loan.tenor;

    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = AmortizationCalculator.monthlyPayment(
      principal,
      annualRate,
      tenor,
    );

    let remaining = principal;

    for (let i = 1; i <= tenor; i++) {
      const interest = remaining * monthlyRate;
      const principalPortion = monthlyPayment - interest;

      remaining -= principalPortion;
      if (remaining < 0) remaining = 0;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedules.push({
        loanId: loan.id,
        installmentNumber: i,
        dueDate,
        interestAmount: Number(interest.toFixed(2)),
        principalAmount: Number(principalPortion.toFixed(2)),
        status: RepaymentScheduleStatus.PENDING,
      });
    }

    return schedules;
  }
}
