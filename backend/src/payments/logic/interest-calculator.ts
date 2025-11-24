export class InterestCalculator {
  /**
   * Calculate accrued interest based on daily interest rate
   * Formula: Principal × (Annual Rate / 365) × Days
   *
   * @param outstandingPrincipal - Current outstanding principal amount
   * @param annualRate - Annual interest rate as percentage (e.g., 12 for 12%)
   * @param daysSinceLastPayment - Number of days since last payment
   * @returns Accrued interest amount (rounded to 2 decimal places)
   */
  static calculateAccruedInterest(
    outstandingPrincipal: number,
    annualRate: number,
    daysSinceLastPayment: number,
  ): number {
    // Edge cases: no interest if no time has passed or no principal outstanding
    if (daysSinceLastPayment <= 0) return 0;
    if (outstandingPrincipal <= 0) return 0;

    // Calculate daily rate: Annual percentage / 100 / 365 days
    const dailyRate = annualRate / 100 / 365;

    // Simple interest: Principal × Rate × Time
    const interest = outstandingPrincipal * dailyRate * daysSinceLastPayment;

    return Number(interest.toFixed(2));
  }
}
