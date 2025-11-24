export class LateFeeCalculator {
  static readonly GRACE_DAYS = 3;
  static readonly LATE_FEE_PER_MONTH = 25;
  static readonly DAYS_PER_MONTH = 30;

  /**
   * Calculate late fee based on months late (cumulative)
   * Examples:
   * - 5 days late  = 0 months = $0
   * - 35 days late = 1 month  = $25
   * - 74 days late = 2 months = $50
   */
  static calculateLateFee(daysLate: number): number {
    if (daysLate <= this.GRACE_DAYS) {
      return 0;
    }

    // Calculate complete months after grace period
    const daysAfterGrace = daysLate - this.GRACE_DAYS;
    const monthsLate = Math.floor(daysAfterGrace / this.DAYS_PER_MONTH);

    return monthsLate * this.LATE_FEE_PER_MONTH;
  }
}
