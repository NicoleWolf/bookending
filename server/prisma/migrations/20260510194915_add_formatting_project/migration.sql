-- CreateTable
CREATE TABLE "FormattingProject" (
    "id" TEXT NOT NULL,
    "manuscriptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT,
    "encoding" TEXT NOT NULL DEFAULT 'AUTO',
    "smartQuotes" TEXT NOT NULL DEFAULT 'CONVERT',
    "uploadedDocxUrl" TEXT,
    "pastedContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormattingProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormattingProject_userId_manuscriptId_key" ON "FormattingProject"("userId", "manuscriptId");

-- AddForeignKey
ALTER TABLE "FormattingProject" ADD CONSTRAINT "FormattingProject_manuscriptId_fkey" FOREIGN KEY ("manuscriptId") REFERENCES "Manuscript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormattingProject" ADD CONSTRAINT "FormattingProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
