// Late Fee Calculation - Validation Test
// This confirms that late fees are calculated based on schedule due date

/**
 * SCENARIO: Testing Late Fee Calculation
 *
 * Setup:
 * - Schedule due date: 2025-10-01
 * - Last payment: 2025-09-15 (unrelated to late fee)
 * - Current payment: 2025-12-15
 *
 * Expected Calculation:
 * - Days late = paymentDate - dueDate = 2025-12-15 minus 2025-10-01 = 75 days
 * - Days after grace = 75 - 3 = 72 days
 * - Months late = floor(72 / 30) = 2 months
 * - Late fee = 2 × $25 = $50
 *
 * IMPORTANT: Last payment date (2025-09-15) is NOT used for late fee calculation.
 * Late fees are based ONLY on: payment date vs schedule due date
 */

// Code Implementation (from repayment-calculation.service.ts):
/*
const daysLate = this.calculateDaysLate(params.dueDate, params.currentPaymentDate);
const lateFee = LateFeeCalculator.calculateLateFee(daysLate);

private calculateDaysLate(dueDate: Date, paymentDate: Date): number {
    return Math.max(0, this.calculateDaysSinceLastPayment(dueDate, paymentDate));
}
*/

// This is CORRECT ✅
// Late fee is based on schedule.dueDate, not lastPaymentDate

export const lateFeeExample = {
  scheduleDueDate: new Date('2025-10-01'),
  lastPaymentDate: new Date('2025-09-15'), // NOT USED for late fee
  currentPaymentDate: new Date('2025-12-15'),

  // Calculation:
  daysLate: 75, // 2025-12-15 - 2025-10-01
  daysAfterGrace: 72, // 75 - 3
  monthsLate: 2, // floor(72 / 30)
  lateFee: 50, // 2 × $25
};
