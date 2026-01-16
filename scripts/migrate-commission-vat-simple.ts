/**
 * Simple Migration: Add commissionVAT using raw SQL
 * Run with: npx tsx scripts/migrate-commission-vat-simple.ts
 */

import prisma from "../src/lib/db"

async function migrateCommissionVAT() {
  console.log("=".repeat(70))
  console.log("COMMISSION VAT MIGRATION (Simple SQL Approach)")
  console.log("=".repeat(70))
  console.log()

  try {
    // Step 1: Ensure column exists (safe - does nothing if column exists)
    console.log("📋 Step 1: Ensuring commissionVAT column exists...")
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Booking"
        ADD COLUMN IF NOT EXISTS "commissionVAT" DOUBLE PRECISION DEFAULT 0 NOT NULL
      `)
      console.log("✅ Column check complete\n")
    } catch (error) {
      console.log("⚠️  Column might already exist, continuing...\n")
    }

    // Step 2: Find bookings that need migration
    console.log("📋 Step 2: Finding bookings with commissionVAT = 0...")
    const result: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Booking"
      WHERE "commissionVAT" = 0
    `
    const count = Number(result[0]?.count || 0)
    console.log(`   Found ${count} bookings to migrate\n`)

    if (count === 0) {
      console.log("✅ No bookings need migration!")
      return
    }

    // Step 3: Update bookings
    console.log("📋 Step 3: Updating bookings...")
    console.log("   Formula: VAT = ROUND(commission * 0.15)")
    console.log("   Formula: New totalAmount = totalAmount + VAT\n")

    const updateResult = await prisma.$executeRaw`
      UPDATE "Booking"
      SET
        "commissionVAT" = ROUND(CAST("commission" * 0.15 AS numeric)),
        "totalAmount" = "totalAmount" + ROUND(CAST("commission" * 0.15 AS numeric))
      WHERE "commissionVAT" = 0
      RETURNING id
    `

    console.log(`✅ Updated ${updateResult} bookings successfully!\n`)

    // Step 4: Verify
    console.log("📋 Step 4: Verification - Sample of updated bookings:")
    const samples: any = await prisma.$queryRaw`
      SELECT
        id,
        "totalAmount",
        commission,
        "commissionVAT",
        status,
        "createdAt"
      FROM "Booking"
      WHERE "commissionVAT" > 0
      ORDER BY "createdAt" DESC
      LIMIT 5
    `

    console.log("-".repeat(70))
    samples.forEach((booking: any, index: number) => {
      console.log(`\n${index + 1}. Booking ${booking.id.substring(0, 8)}...`)
      console.log(`   Total Amount: ${booking.totalAmount} ETB`)
      console.log(`   Commission: ${booking.commission} ETB`)
      console.log(`   VAT: ${booking.commissionVAT} ETB`)
      console.log(`   Status: ${booking.status}`)
    })

    console.log("\n" + "=".repeat(70))
    console.log("✅ MIGRATION COMPLETE!")
    console.log("=".repeat(70))

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
    console.log("\n✅ Migration script completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error)
    process.exit(1)
  })
