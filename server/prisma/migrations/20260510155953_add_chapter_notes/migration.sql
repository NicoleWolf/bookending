/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Thread` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_threadId_fkey";

-- DropForeignKey
ALTER TABLE "Thread" DROP CONSTRAINT "Thread_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Thread";

-- CreateTable
CREATE TABLE "ChapterNote" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "anchor" TEXT,
    "body" TEXT NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChapterNote" ADD CONSTRAINT "ChapterNote_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
