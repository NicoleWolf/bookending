-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AUTHOR', 'READER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'AUTHOR';
