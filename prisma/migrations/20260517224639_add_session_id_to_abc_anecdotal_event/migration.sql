-- AlterTable
ALTER TABLE "ABCRecord" ADD COLUMN     "behaviorName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "AnecdotalRecord" ADD COLUMN     "behaviorName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sessionId" TEXT;

-- AlterTable
ALTER TABLE "EventSampling" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "ABCRecord_sessionId_idx" ON "ABCRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AnecdotalRecord_sessionId_idx" ON "AnecdotalRecord"("sessionId");

-- CreateIndex
CREATE INDEX "EventSampling_sessionId_idx" ON "EventSampling"("sessionId");

-- AddForeignKey
ALTER TABLE "ABCRecord" ADD CONSTRAINT "ABCRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnecdotalRecord" ADD CONSTRAINT "AnecdotalRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSampling" ADD CONSTRAINT "EventSampling_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
