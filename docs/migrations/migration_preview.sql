-- DropForeignKey
ALTER TABLE "SalesPerson" DROP CONSTRAINT "SalesPerson_recruiterId_fkey";

-- DropForeignKey
ALTER TABLE "SalesCommission" DROP CONSTRAINT "SalesCommission_recruiterId_fkey";

-- DropIndex
DROP INDEX "SalesPerson_recruiterId_idx";

-- DropIndex
DROP INDEX "SalesPerson_tier_idx";

-- DropIndex
DROP INDEX "SalesCommission_recruiterId_status_idx";

-- DropIndex
DROP INDEX "SalesCommission_isRecruiterCommission_idx";

-- AlterTable
ALTER TABLE "SalesPerson" DROP COLUMN "recruiterId",
DROP COLUMN "tier";

-- AlterTable
ALTER TABLE "SalesCommission" DROP COLUMN "isRecruiterCommission",
DROP COLUMN "recruiterCommissionAmount",
DROP COLUMN "recruiterId";

