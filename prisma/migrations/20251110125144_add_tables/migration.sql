/*
  Warnings:

  - You are about to drop the `AIOutput` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientInput` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UploadedFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Version` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- DropForeignKey
ALTER TABLE "AIOutput" DROP CONSTRAINT "AIOutput_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ClientInput" DROP CONSTRAINT "ClientInput_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UploadedFile" DROP CONSTRAINT "UploadedFile_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Version" DROP CONSTRAINT "Version_projectId_fkey";

-- DropTable
DROP TABLE "AIOutput";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "ClientInput";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "UploadedFile";

-- DropTable
DROP TABLE "Version";

-- DropEnum
DROP TYPE "ActivityAction";

-- DropEnum
DROP TYPE "BudgetBand";

-- DropEnum
DROP TYPE "BusinessGoal";

-- DropEnum
DROP TYPE "CompanySize";

-- DropEnum
DROP TYPE "ContractDuration";

-- DropEnum
DROP TYPE "CraftFamily";

-- DropEnum
DROP TYPE "EnglishLevel";

-- DropEnum
DROP TYPE "FileCategory";

-- DropEnum
DROP TYPE "FileType";

-- DropEnum
DROP TYPE "GenerationStatus";

-- DropEnum
DROP TYPE "HiringStage";

-- DropEnum
DROP TYPE "ManagementStyle";

-- DropEnum
DROP TYPE "ProjectStatus";

-- DropEnum
DROP TYPE "RoleStatus";

-- DropEnum
DROP TYPE "ServiceType";

-- DropEnum
DROP TYPE "TagCategory";

-- CreateTable
CREATE TABLE "SavedAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intakeData" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefinementMessage" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "changedSections" TEXT[],
    "analysisSnapshot" JSONB,
    "sequenceNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefinementMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedAnalysis_userId_idx" ON "SavedAnalysis"("userId");

-- CreateIndex
CREATE INDEX "SavedAnalysis_createdAt_idx" ON "SavedAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "SavedAnalysis_isFinalized_idx" ON "SavedAnalysis"("isFinalized");

-- CreateIndex
CREATE INDEX "RefinementMessage_analysisId_idx" ON "RefinementMessage"("analysisId");

-- CreateIndex
CREATE INDEX "RefinementMessage_sequenceNumber_idx" ON "RefinementMessage"("sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RefinementMessage_analysisId_sequenceNumber_key" ON "RefinementMessage"("analysisId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "SavedAnalysis" ADD CONSTRAINT "SavedAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementMessage" ADD CONSTRAINT "RefinementMessage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SavedAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
