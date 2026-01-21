-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_parentId_fkey";

-- DropIndex
DROP INDEX "SalesPerson_recruiterId_idx";

-- DropIndex
DROP INDEX "SalesPerson_tier_idx";

-- DropIndex
DROP INDEX "SalesCommission_recruiterId_status_idx";

-- DropIndex
DROP INDEX "SalesCommission_isRecruiterCommission_idx";

-- DropIndex
DROP INDEX "Notification_recipientId_isGroupHeader_isRead_idx";

-- DropIndex
DROP INDEX "Notification_groupKey_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_parentId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "childCount",
DROP COLUMN "groupKey",
DROP COLUMN "groupType",
DROP COLUMN "isGroupHeader",
DROP COLUMN "parentId",
DROP COLUMN "updatedAt";

