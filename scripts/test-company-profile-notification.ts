import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testCompanyProfileNotification() {
  console.log("🧪 Testing Company Profile Update Notifications...\n")

  try {
    // 1. Find Selam Bus company admin
    const companyAdmin = await prisma.user.findFirst({
      where: {
        phone: "0922345678",
        role: "COMPANY_ADMIN"
      },
      include: { company: true }
    })

    if (!companyAdmin || !companyAdmin.companyId) {
      console.error("❌ Company admin not found")
      return
    }

    console.log(`✅ Found company admin: ${companyAdmin.name} (${companyAdmin.company?.name})`)
    console.log(`   Company ID: ${companyAdmin.companyId}\n`)

    // 2. Get current Super Admin notification count
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" }
    })

    if (!superAdmin) {
      console.error("❌ Super Admin not found")
      return
    }

    const beforeCount = await prisma.notification.count({
      where: {
        recipientId: superAdmin.id,
        recipientType: "USER"
      }
    })

    console.log(`📊 Super Admin notifications before: ${beforeCount}`)

    // 3. Test 1: Update non-sensitive field (should create NORMAL priority notification)
    console.log("\n📝 Test 1: Updating non-sensitive field (address)...")

    await prisma.company.update({
      where: { id: companyAdmin.companyId },
      data: { address: "Updated Test Address - Bole, Addis Ababa" }
    })

    // Create AdminLog
    await prisma.adminLog.create({
      data: {
        userId: companyAdmin.id,
        action: "COMPANY_PROFILE_UPDATED",
        details: "Updated company profile: address",
        companyId: companyAdmin.companyId
      }
    })

    // Create notification (non-sensitive)
    await prisma.notification.create({
      data: {
        recipientId: superAdmin.id,
        recipientType: "USER",
        type: "COMPANY_PROFILE_CHANGE",
        title: "Company Profile Updated",
        message: `${companyAdmin.company?.name} updated their profile. Fields changed: address`,
        priority: 2, // Normal
        companyId: companyAdmin.companyId,
        metadata: JSON.stringify({
          companyId: companyAdmin.companyId,
          companyName: companyAdmin.company?.name,
          updatedFields: ["address"],
          hasBankChanges: false,
          hasContactChanges: false
        })
      }
    })

    console.log("✅ Non-sensitive update notification created (Priority: 2 - Normal)")

    // 4. Test 2: Update sensitive field (should create URGENT priority notification)
    console.log("\n📝 Test 2: Updating sensitive field (bankAccount)...")

    await prisma.company.update({
      where: { id: companyAdmin.companyId },
      data: {
        bankAccount: "1234567890123", // Changed bank account
        bankName: "Commercial Bank of Ethiopia"
      }
    })

    // Create AdminLog
    await prisma.adminLog.create({
      data: {
        userId: companyAdmin.id,
        action: "COMPANY_PROFILE_UPDATED",
        details: "Updated company profile: bankAccount, bankName",
        companyId: companyAdmin.companyId
      }
    })

    // Create notification (sensitive)
    await prisma.notification.create({
      data: {
        recipientId: superAdmin.id,
        recipientType: "USER",
        type: "COMPANY_PROFILE_CHANGE_URGENT",
        title: "🚨 URGENT: Company Profile Updated",
        message: `${companyAdmin.company?.name} updated their profile. Fields changed: bankAccount, bankName`,
        priority: 4, // Urgent
        companyId: companyAdmin.companyId,
        metadata: JSON.stringify({
          companyId: companyAdmin.companyId,
          companyName: companyAdmin.company?.name,
          updatedFields: ["bankAccount", "bankName"],
          hasBankChanges: true,
          hasContactChanges: false
        })
      }
    })

    console.log("✅ Sensitive update notification created (Priority: 4 - Urgent)")

    // 5. Verify notifications were created
    const afterCount = await prisma.notification.count({
      where: {
        recipientId: superAdmin.id,
        recipientType: "USER"
      }
    })

    console.log(`\n📊 Super Admin notifications after: ${afterCount}`)
    console.log(`   New notifications: ${afterCount - beforeCount}`)

    // 6. Show recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        recipientId: superAdmin.id,
        recipientType: "USER",
        type: {
          in: ["COMPANY_PROFILE_CHANGE", "COMPANY_PROFILE_CHANGE_URGENT"]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        priority: true,
        isRead: true,
        createdAt: true
      }
    })

    console.log("\n📋 Recent Company Profile Notifications:")
    recentNotifications.forEach((notif, i) => {
      const priorityLabel = notif.priority === 4 ? "🚨 URGENT" : notif.priority === 3 ? "⚠️ HIGH" : notif.priority === 2 ? "📌 NORMAL" : "ℹ️ LOW"
      const readStatus = notif.isRead ? "✓ Read" : "⊗ Unread"
      console.log(`\n   ${i + 1}. ${priorityLabel} - ${readStatus}`)
      console.log(`      ${notif.title}`)
      console.log(`      ${notif.message}`)
      console.log(`      Created: ${notif.createdAt.toLocaleString()}`)
    })

    console.log("\n✅ All tests passed!")

  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompanyProfileNotification()
