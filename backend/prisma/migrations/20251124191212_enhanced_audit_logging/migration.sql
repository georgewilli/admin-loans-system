-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'PERMISSION_DENIED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CHANGED', 'LOAN_CREATED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'LOAN_CLOSED', 'LOAN_UPDATED', 'DISBURSEMENT_INITIATED', 'DISBURSEMENT_COMPLETED', 'DISBURSEMENT_FAILED', 'DISBURSEMENT_ROLLED_BACK', 'PAYMENT_RECEIVED', 'PAYMENT_PROCESSED', 'PAYMENT_FAILED', 'SENSITIVE_DATA_VIEWED', 'REPORT_GENERATED', 'DATA_EXPORTED', 'SYSTEM_ERROR', 'CONFIG_CHANGED');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "action" VARCHAR(20),
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "event_type" "AuditEventType",
ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "new_values" JSONB,
ADD COLUMN     "old_values" JSONB,
ADD COLUMN     "resource" VARCHAR(50),
ADD COLUMN     "resource_id" TEXT,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_agent" VARCHAR(255),
ADD COLUMN     "user_email" TEXT,
ADD COLUMN     "user_role" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
