/*
  Warnings:

  - Added the required column `compensating_actions` to the `rollback_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rollback_records" ADD COLUMN     "compensating_actions" JSONB NOT NULL;
