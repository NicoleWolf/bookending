/*
  Warnings:

  - Added the required column `num` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `location` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressPostal" TEXT,
ADD COLUMN     "digital" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "letterRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "num" TEXT NOT NULL,
ADD COLUMN     "signedRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "location" SET DEFAULT '';
