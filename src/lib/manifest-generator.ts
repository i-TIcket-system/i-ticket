import { generatePassengerManifest } from "@/lib/report-generator"
import fs from "fs"
import path from "path"
import prisma from "@/lib/db"
import { notifySuperAdmins } from "@/lib/notifications/create"

/**
 * Auto-generate and store manifest for Super Admin (i-Ticket platform) tracking
 *
 * This function is called automatically when:
 * 1. Trip status changes to DEPARTED
 * 2. All seats are sold (availableSlots = 0)
 *
 * IMPORTANT: This is for PLATFORM TRACKING ONLY
 * - Files stored in /public/manifests/company-{id}/ for Super Admin access
 * - NO notification sent to companies (they download manually when needed)
 * - Audit logs have companyId = null (Super Admin surveillance, not company operational logs)
 */
export async function generateAndStoreManifest(
  tripId: string,
  triggerType: "AUTO_DEPARTED" | "AUTO_FULL_CAPACITY"
) {
  try {
    // 1. Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        company: {
          select: { id: true, name: true }
        },
        bookings: {
          where: { status: "PAID" },
          select: { totalAmount: true }
        }
      }
    })

    if (!trip) {
      throw new Error(`Trip ${tripId} not found`)
    }

    // 2. Generate Excel manifest using existing report generator
    const buffer = await generatePassengerManifest(tripId)

    // 3. Create directory if not exists
    const manifestDir = path.join(
      process.cwd(),
      "public",
      "manifests",
      `company-${trip.company.id}`
    )

    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true })
    }

    // 4. Save to filesystem with timestamp
    const timestamp = Date.now()
    const fileName = `trip-${tripId}-${timestamp}.xlsx`
    const filePath = path.join(manifestDir, fileName)
    fs.writeFileSync(filePath, buffer)

    // 5. Calculate stats
    const passengerCount = trip.bookings.length
    const totalRevenue = trip.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const platformCommission = totalRevenue * 0.05
    const publicPath = `/manifests/company-${trip.company.id}/${fileName}`

    // 6. Create database records in transaction
    await prisma.$transaction([
      // Create ManifestDownload record
      prisma.manifestDownload.create({
        data: {
          tripId,
          companyId: trip.company.id,
          filePath: publicPath,
          fileSize: buffer.length,
          downloadType: triggerType,
          downloadedBy: null, // SYSTEM (auto-generated)
          passengerCount,
          totalRevenue,
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
        }
      }),

      // Super Admin platform surveillance log (companyId = null)
      // This log is ONLY visible to Super Admin, NOT to companies
      prisma.adminLog.create({
        data: {
          userId: "SYSTEM",
          action: "MANIFEST_AUTO_GENERATED",
          companyId: null, // Platform-level surveillance log
          tripId,
          details: JSON.stringify({
            triggerType,
            targetCompanyId: trip.company.id,
            targetCompanyName: trip.company.name,
            route: `${trip.origin} → ${trip.destination}`,
            departureTime: trip.departureTime.toISOString(),
            passengerCount,
            totalRevenue,
            platformCommission,
            fileSize: buffer.length,
            filePath: publicPath,
            timestamp: new Date().toISOString(),
          })
        }
      })
    ])

    console.log(`✅ Manifest auto-generated for Super Admin tracking: ${triggerType}`, {
      tripId,
      company: trip.company.name,
      route: `${trip.origin} → ${trip.destination}`,
      passengerCount,
      filePath: publicPath
    })

    // Notify Super Admins about manifest generation
    try {
      await notifySuperAdmins("MANIFEST_AUTO_GENERATED", {
        tripId,
        tripRoute: `${trip.origin} → ${trip.destination}`,
        companyName: trip.company.name,
        reason: triggerType === "AUTO_DEPARTED" ? "Trip Departed" : "Full Capacity",
        availableSlots: trip.availableSlots,
      })
    } catch (notifyError) {
      console.error("Failed to notify Super Admins about manifest:", notifyError)
      // Don't throw - notification failure shouldn't break manifest generation
    }

    return { success: true, filePath: publicPath }
  } catch (error) {
    console.error("❌ Failed to generate and store manifest:", error)

    // Log error to database for Super Admin monitoring
    try {
      await prisma.adminLog.create({
        data: {
          userId: "SYSTEM",
          action: "MANIFEST_AUTO_GENERATION_FAILED",
          companyId: null,
          tripId,
          details: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            triggerType,
            timestamp: new Date().toISOString(),
          })
        }
      })
    } catch (logError) {
      console.error("Failed to log manifest generation error:", logError)
    }

    // Don't throw - this is a background process, shouldn't block main flow
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Record manual company manifest download (when company clicks download button)
 * This creates a separate ManifestDownload record for company's operational tracking
 */
export async function recordManualDownload(
  tripId: string,
  userId: string,
  filePath: string,
  fileSize: number
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          where: { status: "PAID" },
          select: { totalAmount: true }
        }
      }
    })

    if (!trip) {
      throw new Error(`Trip ${tripId} not found`)
    }

    const passengerCount = trip.bookings.length
    const totalRevenue = trip.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)

    // Create ManifestDownload record with downloadedBy = userId (manual)
    await prisma.$transaction([
      prisma.manifestDownload.create({
        data: {
          tripId,
          companyId: trip.companyId,
          filePath,
          fileSize,
          downloadType: "MANUAL_COMPANY",
          downloadedBy: userId, // Company user who downloaded
          passengerCount,
          totalRevenue,
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
        }
      }),

      // Company operational log (companyId = their company)
      // This log IS visible to the company in their audit logs
      prisma.adminLog.create({
        data: {
          userId,
          action: "MANIFEST_DOWNLOADED",
          companyId: trip.companyId, // Company-visible log
          tripId,
          details: JSON.stringify({
            route: `${trip.origin} → ${trip.destination}`,
            departureTime: trip.departureTime.toISOString(),
            passengerCount,
            timestamp: new Date().toISOString(),
          })
        }
      })
    ])

    console.log(`✅ Manual manifest download recorded for company`, {
      tripId,
      userId,
      companyId: trip.companyId
    })

    return { success: true }
  } catch (error) {
    console.error("❌ Failed to record manual download:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
