-- AlterTable
ALTER TABLE "BetaReader" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "manuscriptRef" TEXT NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "paraId" INTEGER NOT NULL,
    "selectedText" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "theme" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "manuscriptRef" TEXT NOT NULL,
    "doneChapters" TEXT NOT NULL DEFAULT '[]',
    "mood" TEXT,
    "stars" INTEGER,
    "message" TEXT,
    "submittedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_manuscriptRef_key" ON "ReadingProgress"("userId", "manuscriptRef");

-- AddForeignKey
ALTER TABLE "BetaReader" ADD CONSTRAINT "BetaReader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
