-- AlterTable
ALTER TABLE "PrintOrder" ADD COLUMN     "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDeliveryError" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);
