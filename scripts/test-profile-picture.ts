/**
 * Comprehensive test for profile picture upload feature
 */

import prisma from "../src/lib/db"

async function main() {
  console.log("=== PROFILE PICTURE UPLOAD FEATURE TEST ===\n")

  // Test 1: Verify database schema
  console.log("TEST 1: Database Schema Verification")
  console.log("-------------------------------------")

  try {
    // Check User model
    const userFields = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User' AND column_name = 'profilePicture'
    `
    console.log("✓ User.profilePicture field:", userFields.length > 0 ? "EXISTS" : "MISSING")
    if (userFields.length > 0) {
      console.log(`  - Type: ${userFields[0].data_type}`)
      console.log(`  - Nullable: ${userFields[0].is_nullable}`)
    }

    // Check SalesPerson model
    const salesFields = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'SalesPerson' AND column_name = 'profilePicture'
    `
    console.log("✓ SalesPerson.profilePicture field:", salesFields.length > 0 ? "EXISTS" : "MISSING")
    if (salesFields.length > 0) {
      console.log(`  - Type: ${salesFields[0].data_type}`)
      console.log(`  - Nullable: ${salesFields[0].is_nullable}`)
    }
  } catch (error) {
    console.error("✗ Database schema check failed:", error)
  }

  console.log("\n")

  // Test 2: Check existing users and sales persons
  console.log("TEST 2: Check Existing Records")
  console.log("-------------------------------")

  try {
    const userCount = await prisma.user.count()
    const usersWithPictures = await prisma.user.count({
      where: { profilePicture: { not: null } }
    })
    console.log(`✓ Total Users: ${userCount}`)
    console.log(`✓ Users with profile pictures: ${usersWithPictures}`)

    const salesCount = await prisma.salesPerson.count()
    const salesWithPictures = await prisma.salesPerson.count({
      where: { profilePicture: { not: null } }
    })
    console.log(`✓ Total Sales Persons: ${salesCount}`)
    console.log(`✓ Sales persons with profile pictures: ${salesWithPictures}`)
  } catch (error) {
    console.error("✗ Record count check failed:", error)
  }

  console.log("\n")

  // Test 3: Test profile picture field update
  console.log("TEST 3: Field Update Test")
  console.log("-------------------------")

  try {
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, phone: true, profilePicture: true }
    })

    if (testUser) {
      console.log(`✓ Found test user: ${testUser.name} (${testUser.phone})`)
      console.log(`  - Current profile picture: ${testUser.profilePicture || "None"}`)

      // Test update (simulated - we'll revert it)
      const testPath = "/uploads/profile-pictures/test_" + Date.now() + ".jpg"

      const updated = await prisma.user.update({
        where: { id: testUser.id },
        data: { profilePicture: testPath },
        select: { profilePicture: true }
      })
      console.log(`✓ Update test PASSED: ${updated.profilePicture}`)

      // Revert the test
      await prisma.user.update({
        where: { id: testUser.id },
        data: { profilePicture: testUser.profilePicture }
      })
      console.log("✓ Reverted test update")
    } else {
      console.log("⚠ No test user found to test update")
    }
  } catch (error) {
    console.error("✗ Field update test failed:", error)
  }

  console.log("\n")

  // Test 4: Test with Sales Person
  console.log("TEST 4: Sales Person Field Test")
  console.log("--------------------------------")

  try {
    const testSales = await prisma.salesPerson.findFirst({
      select: { id: true, name: true, phone: true, profilePicture: true }
    })

    if (testSales) {
      console.log(`✓ Found test sales person: ${testSales.name} (${testSales.phone})`)
      console.log(`  - Current profile picture: ${testSales.profilePicture || "None"}`)

      // Test update
      const testPath = "/uploads/profile-pictures/sales_test_" + Date.now() + ".jpg"

      const updated = await prisma.salesPerson.update({
        where: { id: testSales.id },
        data: { profilePicture: testPath },
        select: { profilePicture: true }
      })
      console.log(`✓ Update test PASSED: ${updated.profilePicture}`)

      // Revert
      await prisma.salesPerson.update({
        where: { id: testSales.id },
        data: { profilePicture: testSales.profilePicture }
      })
      console.log("✓ Reverted test update")
    } else {
      console.log("⚠ No test sales person found")
    }
  } catch (error) {
    console.error("✗ Sales person field test failed:", error)
  }

  console.log("\n")

  // Test 5: Check file system
  console.log("TEST 5: File System Check")
  console.log("-------------------------")

  const fs = require("fs")
  const path = require("path")

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profile-pictures")

    if (fs.existsSync(uploadDir)) {
      console.log(`✓ Upload directory exists: ${uploadDir}`)

      const files = fs.readdirSync(uploadDir)
      console.log(`✓ Files in directory: ${files.length}`)

      if (files.length > 0) {
        console.log("  Sample files:")
        files.slice(0, 5).forEach((file: string) => {
          const stats = fs.statSync(path.join(uploadDir, file))
          console.log(`    - ${file} (${Math.round(stats.size / 1024)}KB)`)
        })
      }
    } else {
      console.log("✗ Upload directory does not exist")
    }
  } catch (error) {
    console.error("✗ File system check failed:", error)
  }

  console.log("\n")

  // Test 6: API Route File Check
  console.log("TEST 6: API Route Files Check")
  console.log("-----------------------------")

  try {
    const apiRoute = path.join(process.cwd(), "src", "app", "api", "profile-picture", "route.ts")

    if (fs.existsSync(apiRoute)) {
      console.log("✓ API route exists: /api/profile-picture/route.ts")

      const content = fs.readFileSync(apiRoute, "utf-8")
      console.log("✓ Route exports POST handler:", content.includes("export async function POST"))
      console.log("✓ Route exports DELETE handler:", content.includes("export async function DELETE"))
      console.log("✓ File size validation (5MB):", content.includes("5 * 1024 * 1024"))
      console.log("✓ File type validation:", content.includes("ALLOWED_TYPES"))
      console.log("✓ Crypto random filename:", content.includes("crypto.randomBytes"))
    } else {
      console.log("✗ API route file not found")
    }
  } catch (error) {
    console.error("✗ API route check failed:", error)
  }

  console.log("\n")

  // Test 7: Frontend Component Check
  console.log("TEST 7: Frontend Component Check")
  console.log("---------------------------------")

  try {
    const profilePage = path.join(process.cwd(), "src", "app", "sales", "profile", "page.tsx")

    if (fs.existsSync(profilePage)) {
      console.log("✓ Sales profile page exists")

      const content = fs.readFileSync(profilePage, "utf-8")
      console.log("✓ Imports Camera icon:", content.includes("Camera"))
      console.log("✓ Profile picture state:", content.includes("uploadingProfilePicture"))
      console.log("✓ File input ref:", content.includes("fileInputRef"))
      console.log("✓ Upload handler:", content.includes("handleProfilePictureUpload"))
      console.log("✓ Remove handler:", content.includes("handleRemoveProfilePicture"))
      console.log("✓ Profile Picture Card:", content.includes("Profile Picture"))
      console.log("✓ Image component:", content.includes("<Image"))
    } else {
      console.log("✗ Sales profile page not found")
    }
  } catch (error) {
    console.error("✗ Frontend component check failed:", error)
  }

  console.log("\n")
  console.log("=== TEST SUMMARY ===")
  console.log("All automated tests completed. Manual testing recommended for:")
  console.log("  1. Upload actual image files via UI")
  console.log("  2. Test file size validation (>5MB files)")
  console.log("  3. Test invalid file types (PDF, TXT, etc.)")
  console.log("  4. Test authentication/authorization")
  console.log("  5. Test concurrent uploads")
  console.log("  6. Test with different user roles (driver, conductor, etc.)")
  console.log("\n")
}

main()
  .catch((e) => {
    console.error("Test script error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
