-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "avgSpeedKmh" DOUBLE PRECISION,
ADD COLUMN     "costPerKm" DOUBLE PRECISION,
ADD COLUMN     "criticalDefectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentOdometer" INTEGER,
ADD COLUMN     "defectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "engineHours" INTEGER,
ADD COLUMN     "fuelCapacity" INTEGER,
ADD COLUMN     "fuelCostMTD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fuelCostYTD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fuelEfficiencyL100km" DOUBLE PRECISION,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "idleTimePercentage" DOUBLE PRECISION,
ADD COLUMN     "inspectionDueDate" TIMESTAMP(3),
ADD COLUMN     "lastInspectionDate" TIMESTAMP(3),
ADD COLUMN     "lastPredictionUpdate" TIMESTAMP(3),
ADD COLUMN     "maintenanceCostMTD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maintenanceCostYTD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "maintenanceRiskScore" INTEGER,
ADD COLUMN     "odometerLastUpdated" TIMESTAMP(3),
ADD COLUMN     "predictedFailureDate" TIMESTAMP(3),
ADD COLUMN     "predictedFailureType" TEXT,
ADD COLUMN     "revenuePerKm" DOUBLE PRECISION,
ADD COLUMN     "utilizationRate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "description" TEXT,
    "intervalKm" INTEGER,
    "intervalDays" INTEGER,
    "lastCompletedAt" TIMESTAMP(3),
    "lastCompletedKm" INTEGER,
    "nextDueDate" TIMESTAMP(3),
    "nextDueKm" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "estimatedCostBirr" DOUBLE PRECISION,
    "estimatedDuration" INTEGER,
    "autoCreateWorkOrder" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "serviceProvider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "odometerAtService" INTEGER,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionNotes" TEXT,
    "mechanicSignature" TEXT,
    "scheduleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderPart" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,

    CONSTRAINT "WorkOrderPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "inspectedByUserId" TEXT NOT NULL,
    "inspectedByName" TEXT NOT NULL,
    "odometerReading" INTEGER,
    "checklistResults" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "defectsFound" INTEGER NOT NULL DEFAULT 0,
    "criticalDefects" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "workOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "costBirr" DOUBLE PRECISION NOT NULL,
    "costPerLiter" DOUBLE PRECISION NOT NULL,
    "odometerReading" INTEGER NOT NULL,
    "station" TEXT,
    "city" TEXT,
    "paymentMethod" TEXT,
    "receiptNumber" TEXT,
    "receiptPhoto" TEXT,
    "recordedByUserId" TEXT,
    "recordedByName" TEXT,
    "kmSinceLastFill" INTEGER,
    "litersPer100Km" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdometerLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reading" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "recordedBy" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdometerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_nextDueDate_idx" ON "MaintenanceSchedule"("vehicleId", "nextDueDate");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_nextDueKm_idx" ON "MaintenanceSchedule"("vehicleId", "nextDueKm");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_nextDueDate_isActive_idx" ON "MaintenanceSchedule"("nextDueDate", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");

-- CreateIndex
CREATE INDEX "WorkOrder_vehicleId_status_idx" ON "WorkOrder"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduledDate_idx" ON "WorkOrder"("scheduledDate");

-- CreateIndex
CREATE INDEX "WorkOrder_companyId_idx" ON "WorkOrder"("companyId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_priority_idx" ON "WorkOrder"("status", "priority");

-- CreateIndex
CREATE INDEX "WorkOrderPart_workOrderId_idx" ON "WorkOrderPart"("workOrderId");

-- CreateIndex
CREATE INDEX "VehicleInspection_vehicleId_createdAt_idx" ON "VehicleInspection"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "VehicleInspection_status_idx" ON "VehicleInspection"("status");

-- CreateIndex
CREATE INDEX "VehicleInspection_inspectedByUserId_idx" ON "VehicleInspection"("inspectedByUserId");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_createdAt_idx" ON "FuelEntry"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "FuelEntry_companyId_idx" ON "FuelEntry"("companyId");

-- CreateIndex
CREATE INDEX "FuelEntry_odometerReading_idx" ON "FuelEntry"("odometerReading");

-- CreateIndex
CREATE INDEX "OdometerLog_vehicleId_timestamp_idx" ON "OdometerLog"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "OdometerLog_timestamp_idx" ON "OdometerLog"("timestamp");

-- CreateIndex
CREATE INDEX "Vehicle_maintenanceRiskScore_idx" ON "Vehicle"("maintenanceRiskScore");

-- CreateIndex
CREATE INDEX "Vehicle_inspectionDueDate_idx" ON "Vehicle"("inspectionDueDate");

-- CreateIndex
CREATE INDEX "Vehicle_predictedFailureDate_idx" ON "Vehicle"("predictedFailureDate");

-- CreateIndex
CREATE INDEX "Vehicle_currentOdometer_idx" ON "Vehicle"("currentOdometer");

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPart" ADD CONSTRAINT "WorkOrderPart_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerLog" ADD CONSTRAINT "OdometerLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
