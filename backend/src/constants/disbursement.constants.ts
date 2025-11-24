/**
 * Disbursement-related constants
 * 
 * Centralized configuration for loan disbursement
 */

export const DISBURSEMENT_CONSTANTS = {
    /**
     * Number of days until the first payment is due after disbursement
     */
    DAYS_UNTIL_FIRST_PAYMENT: 30,

    /**
     * Milliseconds in a day for date calculations
     */
    MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
} as const;
