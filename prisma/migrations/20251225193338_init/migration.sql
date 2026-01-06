-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "printerName" TEXT NOT NULL,
    "printerEmail" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "qrCodeUrl" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "priceBwSingle" DECIMAL(65,30) NOT NULL DEFAULT 2.00,
    "priceBwDouble" DECIMAL(65,30) NOT NULL DEFAULT 3.00,
    "priceColorSingle" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "priceColorDouble" DECIMAL(65,30) NOT NULL DEFAULT 8.00,
    "supportsColor" BOOLEAN NOT NULL DEFAULT true,
    "supportsDoubleSided" BOOLEAN NOT NULL DEFAULT true,
    "supportedPageSizes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "totalPages" INTEGER,
    "colorMode" TEXT NOT NULL,
    "isDoubleSided" BOOLEAN NOT NULL,
    "numCopies" INTEGER NOT NULL DEFAULT 1,
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "orientation" TEXT NOT NULL DEFAULT 'portrait',
    "pricePerPage" DECIMAL(65,30) NOT NULL,
    "totalPagesCharged" INTEGER NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "platformFee" DECIMAL(65,30) NOT NULL DEFAULT 0.50,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentIntentId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "emailSentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrinterAnalytics" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalPagesPrinted" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "colorPages" INTEGER NOT NULL DEFAULT 0,
    "bwPages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrinterAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_printerEmail_key" ON "Printer"("printerEmail");

-- CreateIndex
CREATE INDEX "Printer_printerEmail_idx" ON "Printer"("printerEmail");

-- CreateIndex
CREATE INDEX "Printer_ownerId_idx" ON "Printer"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintOrder_orderNumber_key" ON "PrintOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PrintOrder_printerId_idx" ON "PrintOrder"("printerId");

-- CreateIndex
CREATE INDEX "PrintOrder_status_idx" ON "PrintOrder"("status");

-- CreateIndex
CREATE INDEX "PrintOrder_paymentStatus_idx" ON "PrintOrder"("paymentStatus");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PrinterAnalytics_printerId_date_idx" ON "PrinterAnalytics"("printerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PrinterAnalytics_printerId_date_key" ON "PrinterAnalytics"("printerId", "date");

-- AddForeignKey
ALTER TABLE "Printer" ADD CONSTRAINT "Printer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PrintOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrinterAnalytics" ADD CONSTRAINT "PrinterAnalytics_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
