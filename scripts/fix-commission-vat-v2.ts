/**
 * Migration Script V2: Fix Commission VAT Calculation (Correct Version)
 *
 * Previous migration incorrectly rounded intermediate values.
 * This migration recalculates using exact values:
 * - baseCommission = ticketTotal * 0.05 (exact)
 * - VAT = baseCommission * 0.15 (exact, NOT rounded)
 * - totalAmount = ticketTotal + baseCommission + VAT
 *
 * Run with: npx tsx scripts/fix-commission-vat-v2.ts
 */

import prisma from "../src/lib/db"

async function fixCommissionVAT() {
  console.log("=".repeat(70))
  console.log("COMMISSION VAT FIX V2 (Correct Calculation)")
  console.log("=".repeat(70))
  console.log()

  try {
    // Find all bookings to recalculate
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        commission: true,
        commissionVAT: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        passengers: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📋 Found ${bookings.length} bookings to check\n`)

    let fixedCount = 0
    const updates: Array<{
      id: string
      oldCommissionVAT: number
      newCommissionVAT: number
      oldTotalAmount: number
      newTotalAmount: number
    }> = []

    for (const booking of bookings) {
      // Calculate correct values
      const baseCommission = Number(booking.commission)
      const correctVAT = baseCommission * 0.15 // Exact, NOT rounded

      // Calculate what totalAmount SHOULD be
      // totalAmount = ticketPrice + baseCommission + VAT
      // We can calculate ticketPrice from current values:
      const currentCommissionVAT = Number(booking.commissionVAT)
      const currentTotalAmount = Number(booking.totalAmount)

      // ticketPrice = totalAmount - commission - commissionVAT
      const ticketPrice = currentTotalAmount - baseCommission - currentCommissionVAT

      // Now calculate correct totalAmount
      const correctTotalAmount = ticketPrice + baseCommission + correctVAT

      // Check if update needed (allow small floating point tolerance)
      const vatDiff = Math.abs(correctVAT - currentCommissionVAT)
      const totalDiff = Math.abs(correctTotalAmount - currentTotalAmount)

      if (vatDiff > 0.001 || totalDiff > 0.001) {
        updates.push({
          id: booking.id,
          oldCommissionVAT: currentCommissionVAT,
          newCommissionVAT: correctVAT,
          oldTotalAmount: currentTotalAmount,
          newTotalAmount: correctTotalAmount,
        })

        // Update the booking
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            commissionVAT: correctVAT,
            totalAmount: correctTotalAmount,
          },
        })

        fixedCount++
      }
    }

    console.log(`✅ Fixed ${fixedCount} bookings\n`)

    if (updates.length > 0) {
      console.log("Sample Updates (first 10):")
      console.log("-".repeat(70))
      updates.slice(0, 10).forEach((update, index) => {
        console.log(`\n${index + 1}. Booking ${update.id.substring(0, 8)}...`)
        console.log(`   VAT:   ${update.oldCommissionVAT} → ${update.newCommissionVAT}`)
        console.log(`   Total: ${update.oldTotalAmount} → ${update.newTotalAmount}`)
        console.log(`   Difference: ${(update.newTotalAmount - update.oldTotalAmount).toFixed(3)} ETB`)
      })

      if (updates.length > 10) {
        console.log(`\n... and ${updates.length - 10} more bookings`)
      }
    } else {
      console.log("✅ All bookings already have correct values!")
    }

    console.log("\n" + "=".repeat(70))
    console.log("MIGRATION COMPLETE")
    console.log("=".repeat(70))

  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
fixCommissionVAT()
  .then(() => {
    console.log("\n✅ Migration script completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error)
    process.exit(1)
  })
