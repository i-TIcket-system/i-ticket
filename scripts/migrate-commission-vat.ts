/**
 * Migration Script: Add VAT to Existing Bookings
 *
 * This script fixes bookings created before the VAT implementation.
 * It recalculates commissionVAT and updates totalAmount for all old bookings.
 *
 * Run with: npx tsx scripts/migrate-commission-vat.ts
 */

import prisma from "../src/lib/db"

const VAT_RATE = 0.15 // 15% VAT on commission

async function migrateCommissionVAT() {
  console.log("=".repeat(70))
  console.log("COMMISSION VAT MIGRATION")
  console.log("=".repeat(70))
  console.log()

  try {
    // Find all bookings with missing or zero commissionVAT
    const oldBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { commissionVAT: 0 },
          { commissionVAT: null },
        ],
      },
      select: {
        id: true,
        totalAmount: true,
        commission: true,
        commissionVAT: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`📋 Found ${oldBookings.length} bookings to migrate\n`)

    if (oldBookings.length === 0) {
      console.log("✅ No bookings need migration. All bookings are up to date!")
      return
    }

    // Preview first 5 bookings
    console.log("Preview (first 5 bookings):")
    console.log("-".repeat(70))
    oldBookings.slice(0, 5).forEach((booking, index) => {
      const vat = Math.round(Number(booking.commission) * VAT_RATE)
      const newTotal = Number(booking.totalAmount) + vat

      console.log(`\n${index + 1}. Booking ${booking.id.substring(0, 8)}...`)
      console.log(`   Created: ${booking.createdAt.toLocaleDateString()}`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Old totalAmount: ${booking.totalAmount} ETB`)
      console.log(`   Commission: ${booking.commission} ETB`)
      console.log(`   VAT (15%): ${vat} ETB (to be added)`)
      console.log(`   New totalAmount: ${newTotal} ETB`)
    })

    if (oldBookings.length > 5) {
      console.log(`\n... and ${oldBookings.length - 5} more bookings\n`)
    }

    console.log("\n" + "-".repeat(70))
    console.log("\n⚠️  WARNING: This will update the database!")
    console.log("   - Add commissionVAT field to all old bookings")
    console.log("   - Update totalAmount to include VAT")
    console.log("\nContinuing in 3 seconds...\n")

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Perform migration
    let successCount = 0
    let errorCount = 0

    console.log("🔄 Starting migration...\n")

    for (const booking of oldBookings) {
      try {
        const commission = Number(booking.commission)
        const vat = Math.round(commission * VAT_RATE)
        const newTotalAmount = Number(booking.totalAmount) + vat

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            commissionVAT: vat,
            totalAmount: newTotalAmount,
          },
        })

        successCount++

        // Progress indicator
        if (successCount % 10 === 0) {
          console.log(`   ✓ Migrated ${successCount}/${oldBookings.length} bookings...`)
        }
      } catch (error) {
        errorCount++
        console.error(`   ✗ Error migrating booking ${booking.id}:`, error)
      }
    }

    console.log("\n" + "=".repeat(70))
    console.log("MIGRATION COMPLETE")
    console.log("=".repeat(70))
    console.log()
    console.log(`✅ Successfully migrated: ${successCount} bookings`)
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} bookings`)
    }
    console.log()

    // Summary statistics
    const totalCommissionAdded = oldBookings.reduce((sum, b) => {
      return sum + Math.round(Number(b.commission) * VAT_RATE)
    }, 0)

    console.log("Summary:")
    console.log(`   Total VAT added: ${totalCommissionAdded} ETB`)
    console.log(`   Average VAT per booking: ${Math.round(totalCommissionAdded / successCount)} ETB`)
    console.log()

  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateCommissionVAT()
  .then(() => {
    console.log("✅ Migration script completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error)
    process.exit(1)
  })
