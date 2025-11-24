-- AlterTable
ALTER TABLE "loans" ADD COLUMN     "outstandingPrincipal" DECIMAL(15,2) NOT NULL DEFAULT 0;
