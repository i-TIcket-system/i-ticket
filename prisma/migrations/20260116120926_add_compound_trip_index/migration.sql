-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "commissionVAT" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "childCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "groupType" TEXT,
ADD COLUMN     "isGroupHeader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SalesCommission" ADD COLUMN     "isRecruiterCommission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recruiterCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "recruiterId" TEXT;

-- AlterTable
ALTER TABLE "SalesPerson" ADD COLUMN     "alternativePhone" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "recruiterId" TEXT,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE "TripLog" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startOdometer" INTEGER,
    "startFuel" DOUBLE PRECISION,
    "startFuelUnit" TEXT,
    "startedAt" TIMESTAMP(3),
    "startedById" TEXT,
    "startedByName" TEXT,
    "endOdometer" INTEGER,
    "endFuel" DOUBLE PRECISION,
    "endedAt" TIMESTAMP(3),
    "endedById" TEXT,
    "endedByName" TEXT,
    "distanceTraveled" INTEGER,
    "fuelConsumed" DOUBLE PRECISION,
    "fuelEfficiency" DOUBLE PRECISION,
    "startNotes" TEXT,
    "endNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isReadByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isReadByCompany" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompanyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripLog_tripId_key" ON "TripLog"("tripId");

-- CreateIndex
CREATE INDEX "TripLog_tripId_idx" ON "TripLog"("tripId");

-- CreateIndex
CREATE INDEX "TripLog_vehicleId_idx" ON "TripLog"("vehicleId");

-- CreateIndex
CREATE INDEX "TripLog_companyId_idx" ON "TripLog"("companyId");

-- CreateIndex
CREATE INDEX "TripLog_startedAt_idx" ON "TripLog"("startedAt");

-- CreateIndex
CREATE INDEX "TripLog_endedAt_idx" ON "TripLog"("endedAt");

-- CreateIndex
CREATE INDEX "CompanyMessage_companyId_createdAt_idx" ON "CompanyMessage"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyMessage_companyId_isReadByAdmin_idx" ON "CompanyMessage"("companyId", "isReadByAdmin");

-- CreateIndex
CREATE INDEX "CompanyMessage_companyId_isReadByCompany_idx" ON "CompanyMessage"("companyId", "isReadByCompany");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isGroupHeader_isRead_idx" ON "Notification"("recipientId", "isGroupHeader", "isRead");

-- CreateIndex
CREATE INDEX "Notification_groupKey_createdAt_idx" ON "Notification"("groupKey", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_parentId_idx" ON "Notification"("parentId");

-- CreateIndex
CREATE INDEX "SalesCommission_recruiterId_status_idx" ON "SalesCommission"("recruiterId", "status");

-- CreateIndex
CREATE INDEX "SalesCommission_isRecruiterCommission_idx" ON "SalesCommission"("isRecruiterCommission");

-- CreateIndex
CREATE INDEX "SalesPerson_recruiterId_idx" ON "SalesPerson"("recruiterId");

-- CreateIndex
CREATE INDEX "SalesPerson_tier_idx" ON "SalesPerson"("tier");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_companyId_status_idx" ON "Trip"("companyId", "status");

-- CreateIndex
CREATE INDEX "Trip_companyId_status_departureTime_idx" ON "Trip"("companyId", "status", "departureTime");

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPerson" ADD CONSTRAINT "SalesPerson_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "SalesPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "SalesPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMessage" ADD CONSTRAINT "CompanyMessage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMessage" ADD CONSTRAINT "CompanyMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
