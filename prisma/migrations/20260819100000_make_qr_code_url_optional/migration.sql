-- AlterTable
-- qrCodeUrl was NOT NULL from the initial migration, but schema.prisma has
-- always declared it optional. QR codes are now generated on the fly
-- (see src/lib/qrcode.ts) instead of being stored, so nothing populates it.
ALTER TABLE "Printer" ALTER COLUMN "qrCodeUrl" DROP NOT NULL;
