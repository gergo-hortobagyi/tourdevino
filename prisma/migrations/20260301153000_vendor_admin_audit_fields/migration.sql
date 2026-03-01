-- AlterTable
ALTER TABLE "VendorProfile"
  ADD COLUMN "payoutProvider" TEXT,
  ADD COLUMN "payoutAccountMasked" TEXT,
  ADD COLUMN "payoutConfiguredAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "VendorResponse"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ContentPage"
  ADD COLUMN "updatedById" TEXT;

-- AlterTable
ALTER TABLE "FAQ"
  ADD COLUMN "updatedById" TEXT;
