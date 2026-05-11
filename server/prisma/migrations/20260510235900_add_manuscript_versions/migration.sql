-- CreateTable
CREATE TABLE "ManuscriptVersion" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManuscriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManuscriptVersionChapter" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "chapterNum" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ManuscriptVersionChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManuscriptVersion_manuscriptId_userId_number_key" ON "ManuscriptVersion"("manuscriptId", "userId", "number");

-- AddForeignKey
ALTER TABLE "ManuscriptVersion" ADD CONSTRAINT "ManuscriptVersion_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuscriptVersion" ADD CONSTRAINT "ManuscriptVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManuscriptVersionChapter" ADD CONSTRAINT "ManuscriptVersionChapter_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ManuscriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
