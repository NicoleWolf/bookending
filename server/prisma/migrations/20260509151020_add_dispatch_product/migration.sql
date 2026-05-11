-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('LIVE', 'DRAFT', 'LOW_STOCK', 'SOLD_OUT', 'PRE_ORDER');

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "recipients" TEXT NOT NULL DEFAULT 'all',
    "status" "DispatchStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "digital" BOOLEAN NOT NULL DEFAULT false,
    "stockCount" INTEGER,
    "manuscriptId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
