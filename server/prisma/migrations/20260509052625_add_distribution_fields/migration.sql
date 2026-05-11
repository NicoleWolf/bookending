-- AlterTable
ALTER TABLE "DistributionChannel" ADD COLUMN     "formats" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "listPrice" DOUBLE PRECISION;
