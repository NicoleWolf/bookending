-- CreateTable
CREATE TABLE "StorefrontSettings" (
    "id" TEXT NOT NULL,
    "shopName" TEXT NOT NULL DEFAULT '',
    "shopSlug" TEXT NOT NULL DEFAULT '',
    "shopTagline" TEXT NOT NULL DEFAULT '',
    "shipsFrom" TEXT NOT NULL DEFAULT '',
    "notifPerOrder" BOOLEAN NOT NULL DEFAULT true,
    "notifDigest" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "collectVat" BOOLEAN NOT NULL DEFAULT false,
    "iossNumber" TEXT,
    "ukVatNumber" TEXT,
    "lowStockAt" INTEGER NOT NULL DEFAULT 5,
    "emailTemplate" TEXT NOT NULL DEFAULT '',
    "packingTemplate" TEXT NOT NULL DEFAULT '',
    "letterTemplate" TEXT NOT NULL DEFAULT '',
    "refundPolicy" TEXT NOT NULL DEFAULT '',
    "returnWindow" INTEGER NOT NULL DEFAULT 14,
    "returnShipping" TEXT NOT NULL DEFAULT 'buyer',
    "digitalRefunds" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontSettings_userId_key" ON "StorefrontSettings"("userId");

-- AddForeignKey
ALTER TABLE "StorefrontSettings" ADD CONSTRAINT "StorefrontSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
