export interface AllocationResult {
  interestPaid: number;
  lateFeePaid: number;
  principalPaid: number;
}

export class AllocationEngine {
  static allocate(
    paymentAmount: number,
    accruedInterest: number,
    lateFee: number,
  ): AllocationResult {
    let remaining = paymentAmount;

    const interestPaid = Math.min(remaining, accruedInterest);
    remaining -= interestPaid;

    const lateFeePaid = Math.min(remaining, lateFee);
    remaining -= lateFeePaid;

    const principalPaid = remaining > 0 ? remaining : 0;

    return {
      interestPaid: Number(interestPaid.toFixed(2)),
      lateFeePaid: Number(lateFeePaid.toFixed(2)),
      principalPaid: Number(principalPaid.toFixed(2)),
    };
  }
}
