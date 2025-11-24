/*
  Warnings:

  - Made the column `rolled_back_by` on table `rollback_records` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rollback_records" ADD COLUMN     "error_details" JSONB,
ALTER COLUMN "rolled_back_by" SET NOT NULL,
ALTER COLUMN "rolled_back_by" SET DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "rollback_records_transaction_id_idx" ON "rollback_records"("transaction_id");

-- CreateIndex
CREATE INDEX "rollback_records_original_operation_idx" ON "rollback_records"("original_operation");
