-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "contentHash" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "storageLimitBytes" BIGINT NOT NULL DEFAULT 104857600,
ADD COLUMN     "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Credential_issuedAt_idx" ON "Credential"("issuedAt");
