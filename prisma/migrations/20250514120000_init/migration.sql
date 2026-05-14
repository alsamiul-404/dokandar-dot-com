-- CreateEnum
CREATE TYPE "CreditEntryType" AS ENUM ('SALE_CREDIT', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "StockLogReason" AS ENUM ('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'OPENING');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "ownerName" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL DEFAULT '',
    "buyPrice" DECIMAL(14, 4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14, 4) NOT NULL,
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 5,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT,
    "totalAmount" DECIMAL(14, 4) NOT NULL,
    "cashPaid" DECIMAL(14, 4) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(14, 4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLine" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14, 4) NOT NULL,
    "lineTotal" DECIMAL(14, 4) NOT NULL,

    CONSTRAINT "SaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditEntry" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "amount" DECIMAL(14, 4) NOT NULL,
    "entryType" "CreditEntryType" NOT NULL DEFAULT 'ADJUSTMENT',
    "description" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "quantityDelta" INTEGER NOT NULL,
    "reason" "StockLogReason" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_shopId_idx" ON "User"("shopId");

-- CreateIndex
CREATE INDEX "Customer_shopId_idx" ON "Customer"("shopId");

-- CreateIndex
CREATE INDEX "Customer_shopId_phone_idx" ON "Customer"("shopId", "phone");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Product_shopId_sku_idx" ON "Product"("shopId", "sku");

-- CreateIndex
CREATE INDEX "Sale_shopId_idx" ON "Sale"("shopId");

-- CreateIndex
CREATE INDEX "Sale_shopId_soldAt_idx" ON "Sale"("shopId", "soldAt");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "SaleLine_saleId_idx" ON "SaleLine"("saleId");

-- CreateIndex
CREATE INDEX "SaleLine_productId_idx" ON "SaleLine"("productId");

-- CreateIndex
CREATE INDEX "CreditEntry_shopId_idx" ON "CreditEntry"("shopId");

-- CreateIndex
CREATE INDEX "CreditEntry_customerId_idx" ON "CreditEntry"("customerId");

-- CreateIndex
CREATE INDEX "CreditEntry_shopId_customerId_recordedAt_idx" ON "CreditEntry"("shopId", "customerId", "recordedAt");

-- CreateIndex
CREATE INDEX "StockLog_productId_idx" ON "StockLog"("productId");

-- CreateIndex
CREATE INDEX "StockLog_saleId_idx" ON "StockLog"("saleId");

-- CreateIndex
CREATE INDEX "StockLog_productId_createdAt_idx" ON "StockLog"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEntry" ADD CONSTRAINT "CreditEntry_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEntry" ADD CONSTRAINT "CreditEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEntry" ADD CONSTRAINT "CreditEntry_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
