/*
  Warnings:

  - You are about to drop the column `rolled_back_at` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "rolled_back_at",
ADD COLUMN     "repayment_schedule_id" TEXT,
ALTER COLUMN "late_fee_paid" SET DEFAULT 0,
ALTER COLUMN "days_late" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_repayment_schedule_id_fkey" FOREIGN KEY ("repayment_schedule_id") REFERENCES "repayment_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
