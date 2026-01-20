-- CreateTable
CREATE TABLE "TripTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "distance" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "busType" TEXT NOT NULL,
    "hasWater" BOOLEAN NOT NULL DEFAULT false,
    "hasFood" BOOLEAN NOT NULL DEFAULT false,
    "intermediateStops" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripTemplate_companyId_origin_destination_idx" ON "TripTemplate"("companyId", "origin", "destination");

-- CreateIndex
CREATE INDEX "TripTemplate_companyId_name_idx" ON "TripTemplate"("companyId", "name");

-- AddForeignKey
ALTER TABLE "TripTemplate" ADD CONSTRAINT "TripTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
