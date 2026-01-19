-- CreateTable
CREATE TABLE "ManifestDownload" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadType" TEXT NOT NULL,
    "downloadedBy" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passengerCount" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManifestDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManifestDownload_tripId_idx" ON "ManifestDownload"("tripId");

-- CreateIndex
CREATE INDEX "ManifestDownload_companyId_downloadedAt_idx" ON "ManifestDownload"("companyId", "downloadedAt");

-- CreateIndex
CREATE INDEX "ManifestDownload_downloadType_idx" ON "ManifestDownload"("downloadType");

-- CreateIndex
CREATE INDEX "ManifestDownload_downloadedBy_idx" ON "ManifestDownload"("downloadedBy");

-- AddForeignKey
ALTER TABLE "ManifestDownload" ADD CONSTRAINT "ManifestDownload_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
