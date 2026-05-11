-- AlterTable: drop theme, add status with default 'submitted' (existing rows become submitted)
ALTER TABLE "Annotation" DROP COLUMN IF EXISTS "theme",
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'submitted';

-- AlterTable: add release and expected dates to chapters
ALTER TABLE "Chapter"
ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "expectedAt" TIMESTAMP(3);

-- CreateTable: threaded replies on annotations
CREATE TABLE IF NOT EXISTS "AnnotationReply" (
    "id" TEXT NOT NULL,
    "annotationId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnotationReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable: per-chapter impression time-series
CREATE TABLE IF NOT EXISTS "ImpressionPoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "manuscriptRef" TEXT NOT NULL,
    "chapterNum" INTEGER NOT NULL,
    "stance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImpressionPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ImpressionPoint_userId_manuscriptRef_chapterNum_key"
  ON "ImpressionPoint"("userId", "manuscriptRef", "chapterNum");

-- AddForeignKey
ALTER TABLE "AnnotationReply"
  ADD CONSTRAINT "AnnotationReply_annotationId_fkey"
  FOREIGN KEY ("annotationId") REFERENCES "Annotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
