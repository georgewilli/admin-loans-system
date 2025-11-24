/*
  Warnings:

  - You are about to drop the column `compensating_actions` on the `rollback_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "rollback_records" DROP COLUMN "compensating_actions";
