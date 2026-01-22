import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function validateSeed() {
  console.log("🔍 Validating Seed Data Against CLAUDE.md\n")
  console.log("=".repeat(60))

  const issues = []

  // Check expected test logins from CLAUDE.md
  console.log("\n📋 Expected Test Logins (from CLAUDE.md):")
  console.log("   - Selam Bus Admin: 0922345678 / demo123")
  console.log("   - Super Admin: 0911223344 / demo123")
  console.log("   - Drivers: 0914444444-45 / demo123")
  console.log("   - Customer: 0912345678 / demo123")

  // Validate Selam Bus Admin
  const selamAdmin = await prisma.user.findUnique({
    where: { phone: "0922345678" },
    include: { company: true }
  })

  console.log("\n✅ Selam Bus Admin:")
  if (!selamAdmin) {
    issues.push("❌ Selam Bus Admin (0922345678) not found!")
  } else if (selamAdmin.role !== "COMPANY_ADMIN") {
    issues.push(`❌ User 0922345678 has role ${selamAdmin.role}, expected COMPANY_ADMIN`)
  } else if (selamAdmin.company?.name !== "Selam Bus") {
    issues.push(`❌ User 0922345678 belongs to ${selamAdmin.company?.name}, expected Selam Bus`)
  } else {
    console.log(`   ✅ Found: ${selamAdmin.name} (${selamAdmin.company?.name})`)
  }

  // Validate Super Admin
  const superAdmin = await prisma.user.findUnique({
    where: { phone: "0911223344" }
  })

  console.log("\n✅ Super Admin:")
  if (!superAdmin) {
    issues.push("❌ Super Admin (0911223344) not found!")
  } else if (superAdmin.role !== "SUPER_ADMIN") {
    issues.push(`❌ User 0911223344 has role ${superAdmin.role}, expected SUPER_ADMIN`)
  } else {
    console.log(`   ✅ Found: ${superAdmin.name}`)
  }

  // Validate Drivers (0914444444-45)
  console.log("\n✅ Drivers:")
  const driver1 = await prisma.user.findUnique({
    where: { phone: "0914444444" }
  })
  const driver2 = await prisma.user.findUnique({
    where: { phone: "0914444445" }
  })

  if (!driver1) {
    issues.push("❌ Driver 1 (0914444444) not found!")
  } else if (driver1.staffRole !== "DRIVER") {
    issues.push(`❌ User 0914444444 has staffRole ${driver1.staffRole}, expected DRIVER`)
  } else {
    console.log(`   ✅ Driver 1: ${driver1.name} (${driver1.staffRole})`)
  }

  if (!driver2) {
    issues.push("❌ Driver 2 (0914444445) not found!")
  } else if (driver2.staffRole !== "DRIVER") {
    issues.push(`❌ User 0914444445 has staffRole ${driver2.staffRole}, expected DRIVER`)
  } else {
    console.log(`   ✅ Driver 2: ${driver2.name} (${driver2.staffRole})`)
  }

  // Validate Customer
  console.log("\n✅ Customer:")
  const customer = await prisma.user.findUnique({
    where: { phone: "0912345678" }
  })

  if (!customer) {
    issues.push("❌ Customer (0912345678) not found in seed!")
    console.log("   ❌ NOT FOUND - Expected phone: 0912345678")

    // Show what customer phones we DO have
    const actualCustomers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { name: true, phone: true }
    })
    console.log("\n   📋 Actual customer phones in DB:")
    actualCustomers.forEach(c => {
      console.log(`      - ${c.phone} (${c.name})`)
    })
  } else if (customer.role !== "CUSTOMER") {
    issues.push(`❌ User 0912345678 has role ${customer.role}, expected CUSTOMER`)
  } else {
    console.log(`   ✅ Found: ${customer.name}`)
  }

  // Check Selam Bus staff completeness
  console.log("\n✅ Selam Bus Staff Completeness:")
  const selamBus = await prisma.company.findFirst({
    where: { name: "Selam Bus" }
  })

  if (selamBus) {
    const selamStaff = await prisma.user.findMany({
      where: { companyId: selamBus.id },
      select: { staffRole: true }
    })

    const staffRoles = selamStaff.map(s => s.staffRole)
    console.log(`   Found ${selamStaff.length} staff members`)
    console.log(`   Roles: ${staffRoles.filter(Boolean).join(", ")}`)

    // Check required roles
    const hasDriver = staffRoles.includes("DRIVER")
    const hasConductor = staffRoles.includes("CONDUCTOR")
    const hasTicketer = staffRoles.includes("MANUAL_TICKETER")

    if (!hasDriver) issues.push("❌ Selam Bus has no DRIVER")
    if (!hasConductor) issues.push("❌ Selam Bus has no CONDUCTOR")
    if (!hasTicketer) issues.push("❌ Selam Bus has no MANUAL_TICKETER")

    console.log(`   Driver: ${hasDriver ? "✅" : "❌"}`)
    console.log(`   Conductor: ${hasConductor ? "✅" : "❌"}`)
    console.log(`   Manual Ticketer: ${hasTicketer ? "✅" : "❌"}`)
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  if (issues.length === 0) {
    console.log("\n✅ ALL CHECKS PASSED! Seed data matches CLAUDE.md\n")
  } else {
    console.log(`\n❌ FOUND ${issues.length} ISSUE(S):\n`)
    issues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue}`)
    })
    console.log("\n💡 Fix these issues in prisma/seed.ts and re-run: npm run seed\n")
  }
}

validateSeed()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
