-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "level" VARCHAR(10) NOT NULL DEFAULT 'info',
ADD COLUMN     "service" VARCHAR(20) NOT NULL DEFAULT 'system';

-- CreateIndex
CREATE INDEX "audit_logs_service_idx" ON "audit_logs"("service");

-- CreateIndex
CREATE INDEX "audit_logs_level_idx" ON "audit_logs"("level");
