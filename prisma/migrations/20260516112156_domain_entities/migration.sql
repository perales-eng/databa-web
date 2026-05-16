-- CreateEnum
CREATE TYPE "MeasurementMethodType" AS ENUM ('FREQUENCY', 'DURATION', 'LATENCY', 'INTENSITY', 'TEMPORAL_SAMPLING', 'PERCENTAGE_OPPORTUNITY', 'EVENT_SAMPLING', 'ANECDOTAL', 'ABC');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('SCHEDULED', 'IMMEDIATE');

-- CreateEnum
CREATE TYPE "PeriodicType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SamplingType" AS ENUM ('PARTIAL', 'WHOLE', 'MOMENTARY');

-- CreateEnum
CREATE TYPE "OpportunityEndCondition" AS ENUM ('MANUAL', 'TIME_LIMIT', 'OPPORTUNITY_LIMIT');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "Behavior" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "behaviorId" TEXT,
    "behaviorName" TEXT NOT NULL,
    "methodType" "MeasurementMethodType" NOT NULL,
    "description" TEXT,
    "functionTypes" JSONB,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BehaviorMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "sessionType" "SessionType" NOT NULL DEFAULT 'SCHEDULED',
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "isPeriodic" BOOLEAN NOT NULL DEFAULT false,
    "periodicType" "PeriodicType" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "behaviorMethodId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "methodType" "MeasurementMethodType" NOT NULL,
    "behaviorName" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL,
    "resultUnit" TEXT,
    "measurementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionDurationSec" INTEGER,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "behaviorMethodId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalOpportunities" INTEGER NOT NULL,
    "successfulOpportunities" INTEGER NOT NULL,
    "successPercentage" DOUBLE PRECISION NOT NULL,
    "opportunityDetails" JSONB NOT NULL,
    "endCondition" "OpportunityEndCondition" NOT NULL DEFAULT 'MANUAL',
    "measurementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporalSamplingResult" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "behaviorMethodId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "samplingType" "SamplingType" NOT NULL,
    "intervalDurationSec" INTEGER NOT NULL,
    "totalDurationSec" INTEGER NOT NULL,
    "totalIntervals" INTEGER NOT NULL,
    "markedIntervals" INTEGER NOT NULL,
    "markedPercentage" DOUBLE PRECISION NOT NULL,
    "intervalDetails" JSONB NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporalSamplingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABCRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "durationSec" INTEGER,
    "location" TEXT,
    "peoplePresent" TEXT,
    "antecedentType" TEXT,
    "antecedentDescription" TEXT,
    "behaviorDescription" TEXT NOT NULL,
    "behaviorDurationSec" INTEGER,
    "behaviorIntensity" INTEGER,
    "behaviorTopography" TEXT,
    "consequenceType" TEXT,
    "consequenceDescription" TEXT,
    "whatObtained" TEXT,
    "whatAvoided" TEXT,
    "functionAnalysis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABCRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnecdotalRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "recordTime" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" TEXT,
    "category" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnecdotalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSampling" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "behaviorName" TEXT NOT NULL,
    "sessionDurationMin" INTEGER NOT NULL,
    "intensityScale" INTEGER,
    "dataSaveType" TEXT,
    "data" JSONB NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSampling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementProgress" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "behaviorMethodId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "methodType" "MeasurementMethodType" NOT NULL,
    "data" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MeasurementProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Behavior_organizationId_idx" ON "Behavior"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Behavior_organizationId_name_key" ON "Behavior"("organizationId", "name");

-- CreateIndex
CREATE INDEX "BehaviorMethod_organizationId_idx" ON "BehaviorMethod"("organizationId");

-- CreateIndex
CREATE INDEX "BehaviorMethod_studentId_idx" ON "BehaviorMethod"("studentId");

-- CreateIndex
CREATE INDEX "BehaviorMethod_methodType_idx" ON "BehaviorMethod"("methodType");

-- CreateIndex
CREATE INDEX "TherapySession_organizationId_idx" ON "TherapySession"("organizationId");

-- CreateIndex
CREATE INDEX "TherapySession_studentId_idx" ON "TherapySession"("studentId");

-- CreateIndex
CREATE INDEX "TherapySession_sessionDate_idx" ON "TherapySession"("sessionDate");

-- CreateIndex
CREATE INDEX "TherapySession_status_idx" ON "TherapySession"("status");

-- CreateIndex
CREATE INDEX "MeasurementResult_organizationId_idx" ON "MeasurementResult"("organizationId");

-- CreateIndex
CREATE INDEX "MeasurementResult_behaviorMethodId_idx" ON "MeasurementResult"("behaviorMethodId");

-- CreateIndex
CREATE INDEX "MeasurementResult_sessionId_idx" ON "MeasurementResult"("sessionId");

-- CreateIndex
CREATE INDEX "MeasurementResult_methodType_idx" ON "MeasurementResult"("methodType");

-- CreateIndex
CREATE INDEX "OpportunityResult_organizationId_idx" ON "OpportunityResult"("organizationId");

-- CreateIndex
CREATE INDEX "OpportunityResult_studentId_idx" ON "OpportunityResult"("studentId");

-- CreateIndex
CREATE INDEX "TemporalSamplingResult_organizationId_idx" ON "TemporalSamplingResult"("organizationId");

-- CreateIndex
CREATE INDEX "TemporalSamplingResult_studentId_idx" ON "TemporalSamplingResult"("studentId");

-- CreateIndex
CREATE INDEX "ABCRecord_organizationId_idx" ON "ABCRecord"("organizationId");

-- CreateIndex
CREATE INDEX "ABCRecord_studentId_idx" ON "ABCRecord"("studentId");

-- CreateIndex
CREATE INDEX "ABCRecord_occurredAt_idx" ON "ABCRecord"("occurredAt");

-- CreateIndex
CREATE INDEX "AnecdotalRecord_organizationId_idx" ON "AnecdotalRecord"("organizationId");

-- CreateIndex
CREATE INDEX "AnecdotalRecord_studentId_idx" ON "AnecdotalRecord"("studentId");

-- CreateIndex
CREATE INDEX "AnecdotalRecord_recordDate_idx" ON "AnecdotalRecord"("recordDate");

-- CreateIndex
CREATE INDEX "EventSampling_organizationId_idx" ON "EventSampling"("organizationId");

-- CreateIndex
CREATE INDEX "EventSampling_studentId_idx" ON "EventSampling"("studentId");

-- CreateIndex
CREATE INDEX "MeasurementProgress_organizationId_idx" ON "MeasurementProgress"("organizationId");

-- CreateIndex
CREATE INDEX "MeasurementProgress_sessionId_idx" ON "MeasurementProgress"("sessionId");

-- CreateIndex
CREATE INDEX "MeasurementProgress_completedAt_idx" ON "MeasurementProgress"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementProgress_behaviorMethodId_sessionId_key" ON "MeasurementProgress"("behaviorMethodId", "sessionId");

-- CreateIndex
CREATE INDEX "Student_organizationId_deletedAt_idx" ON "Student"("organizationId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Behavior" ADD CONSTRAINT "Behavior_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorMethod" ADD CONSTRAINT "BehaviorMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorMethod" ADD CONSTRAINT "BehaviorMethod_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorMethod" ADD CONSTRAINT "BehaviorMethod_behaviorId_fkey" FOREIGN KEY ("behaviorId") REFERENCES "Behavior"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementResult" ADD CONSTRAINT "MeasurementResult_behaviorMethodId_fkey" FOREIGN KEY ("behaviorMethodId") REFERENCES "BehaviorMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementResult" ADD CONSTRAINT "MeasurementResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityResult" ADD CONSTRAINT "OpportunityResult_behaviorMethodId_fkey" FOREIGN KEY ("behaviorMethodId") REFERENCES "BehaviorMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityResult" ADD CONSTRAINT "OpportunityResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporalSamplingResult" ADD CONSTRAINT "TemporalSamplingResult_behaviorMethodId_fkey" FOREIGN KEY ("behaviorMethodId") REFERENCES "BehaviorMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporalSamplingResult" ADD CONSTRAINT "TemporalSamplingResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABCRecord" ADD CONSTRAINT "ABCRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnecdotalRecord" ADD CONSTRAINT "AnecdotalRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSampling" ADD CONSTRAINT "EventSampling_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementProgress" ADD CONSTRAINT "MeasurementProgress_behaviorMethodId_fkey" FOREIGN KEY ("behaviorMethodId") REFERENCES "BehaviorMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementProgress" ADD CONSTRAINT "MeasurementProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TherapySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
