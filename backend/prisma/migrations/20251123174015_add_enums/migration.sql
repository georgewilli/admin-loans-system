/*
  Warnings:

  - The `level` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `disbursements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `loans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `repayment_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `original_operation` on the `rollback_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "RepaymentScheduleStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DISBURSEMENT', 'REPAYMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('DISBURSEMENT', 'REPAYMENT', 'ROLLBACK', 'MANUAL_ROLLBACK_DISBURSEMENT', 'MANUAL_ROLLBACK_PAYMENT');

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "level",
ADD COLUMN     "level" "LogLevel" NOT NULL DEFAULT 'INFO';

-- AlterTable
ALTER TABLE "disbursements" DROP COLUMN "status",
ADD COLUMN     "status" "DisbursementStatus" NOT NULL;

-- AlterTable
ALTER TABLE "loans" DROP COLUMN "status",
ADD COLUMN     "status" "LoanStatus" NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "repayment_schedules" DROP COLUMN "status",
ADD COLUMN     "status" "RepaymentScheduleStatus" NOT NULL;

-- AlterTable
ALTER TABLE "rollback_records" DROP COLUMN "original_operation",
ADD COLUMN     "original_operation" "OperationType" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "audit_logs_level_idx" ON "audit_logs"("level");

-- CreateIndex
CREATE INDEX "rollback_records_original_operation_idx" ON "rollback_records"("original_operation");
