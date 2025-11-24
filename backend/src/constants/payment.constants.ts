/**
 * Payment-related constants
 * 
 * Centralized configuration for payment calculations and fees
 */

export const PAYMENT_CONSTANTS = {
    /**
     * Flat late fee charged per late repayment (in dollars)
     */
    FLAT_LATE_FEE: 25,

    /**
     * Grace period in days before late fee applies
     */
    GRACE_PERIOD_DAYS: 3,

    /**
     * Number of days in a year for interest calculations
     */
    DAYS_PER_YEAR: 365,

    /**
     * Milliseconds in a day for date calculations
     */
    MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,

    /**
     * Minimum accrued interest threshold (in dollars)
     * Interest below this amount is not processed
     */
    MIN_ACCRUED_INTEREST: 0.01,
} as const;
