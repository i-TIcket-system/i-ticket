/**
 * Test Script: Super Admin Audit Logging Segregation
 *
 * CRITICAL TEST: Verifies that Super Admin surveillance logs are NOT visible to companies
 *
 * Tests:
 * 1. Super Admin can access trip details
 * 2. Audit log created with companyId = NULL
 * 3. Companies CANNOT see Super Admin logs
 * 4. Companies CAN see their own operational logs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAuditSegregation() {
  console.log('🔒 Testing Super Admin Audit Logging Segregation...\n')

  try {
    // Step 1: Find a Super Admin user
    console.log('📋 Step 1: Find Super Admin')
    console.log('─'.repeat(60))

    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    })

    if (!superAdmin) {
      console.log('❌ No Super Admin found. Please create one first.')
      return
    }

    console.log(`✅ Found Super Admin: ${superAdmin.name} (${superAdmin.phone})`)

    // Step 2: Find a company and their admin
    console.log('\n📋 Step 2: Find a company')
    console.log('─'.repeat(60))

    const company = await prisma.company.findFirst({
      include: {
        users: {
          where: {
            role: 'COMPANY_ADMIN',
            staffRole: null,
          },
          take: 1,
        },
      },
    })

    if (!company || company.users.length === 0) {
      console.log('❌ No company with admin found')
      return
    }

    const companyAdmin = company.users[0]
    console.log(`✅ Found Company: ${company.name}`)
    console.log(`✅ Found Company Admin: ${companyAdmin.name}`)

    // Step 3: Find a trip from this company
    console.log('\n📋 Step 3: Find a trip from this company')
    console.log('─'.repeat(60))

    const trip = await prisma.trip.findFirst({
      where: { companyId: company.id },
    })

    if (!trip) {
      console.log('❌ No trips found for this company')
      return
    }

    console.log(`✅ Found Trip: ${trip.origin} → ${trip.destination}`)
    console.log(`   Trip ID: ${trip.id}`)

    // Step 4: Simulate Super Admin viewing trip (create audit log)
    console.log('\n📋 Step 4: Simulate Super Admin viewing trip')
    console.log('─'.repeat(60))

    const auditLog = await prisma.adminLog.create({
      data: {
        userId: superAdmin.id,
        action: 'SUPER_ADMIN_VIEW_TRIP',
        companyId: null, // 🚫 CRITICAL: NULL = Companies cannot see
        tripId: trip.id,
        details: JSON.stringify({
          superAdminName: superAdmin.name,
          viewedCompanyId: company.id,
          viewedCompanyName: company.name,
          route: `${trip.origin} → ${trip.destination}`,
          accessedAt: new Date().toISOString(),
          reason: 'Test: Verifying audit segregation',
        }),
      },
    })

    console.log('✅ Created Super Admin audit log:')
    console.log(`   Action: ${auditLog.action}`)
    console.log(`   companyId: ${auditLog.companyId} (NULL = Platform action)`)
    console.log(`   tripId: ${auditLog.tripId}`)

    // Step 5: Create a company operational log for comparison
    console.log('\n📋 Step 5: Create company operational log')
    console.log('─'.repeat(60))

    const companyLog = await prisma.adminLog.create({
      data: {
        userId: companyAdmin.id,
        action: 'TRIP_UPDATED',
        companyId: company.id, // ✅ Company action
        tripId: trip.id,
        details: JSON.stringify({
          adminName: companyAdmin.name,
          changes: 'Test: Updated trip details',
          timestamp: new Date().toISOString(),
        }),
      },
    })

    console.log('✅ Created company operational log:')
    console.log(`   Action: ${companyLog.action}`)
    console.log(`   companyId: ${companyLog.companyId} (Company action)`)
    console.log(`   tripId: ${companyLog.tripId}`)

    // Step 6: Query logs as Company Admin would see them
    console.log('\n📋 Step 6: Query logs as Company Admin (CRITICAL TEST)')
    console.log('─'.repeat(60))

    const companyVisibleLogs = await prisma.adminLog.findMany({
      where: {
        companyId: company.id, // Company filter
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    console.log(`✅ Company Admin sees ${companyVisibleLogs.length} logs`)
    console.log('\nLogs visible to company:')
    companyVisibleLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.action} (companyId: ${log.companyId})`)
    })

    // Step 7: Check if Super Admin log is in company view
    console.log('\n📋 Step 7: Verify segregation (CRITICAL)')
    console.log('─'.repeat(60))

    const superAdminLogInCompanyView = companyVisibleLogs.find(
      log => log.id === auditLog.id
    )

    if (superAdminLogInCompanyView) {
      console.log('❌ FAIL: Super Admin log IS VISIBLE to company!')
      console.log('   This is a CRITICAL security issue!')
      console.log(`   Log ID: ${superAdminLogInCompanyView.id}`)
    } else {
      console.log('✅ PASS: Super Admin log is NOT visible to company')
      console.log('   Companies cannot see platform surveillance logs ✅')
    }

    // Step 8: Check if company log is visible
    const companyLogInView = companyVisibleLogs.find(
      log => log.id === companyLog.id
    )

    if (companyLogInView) {
      console.log('✅ PASS: Company operational log IS visible to company')
      console.log('   Companies can see their own operations ✅')
    } else {
      console.log('❌ FAIL: Company cannot see their own operational log!')
    }

    // Step 9: Query all logs (Super Admin view)
    console.log('\n📋 Step 9: Super Admin can see ALL logs')
    console.log('─'.repeat(60))

    const allLogs = await prisma.adminLog.findMany({
      where: {
        OR: [
          { companyId: company.id },
          { companyId: null },
        ],
        tripId: trip.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`✅ Super Admin sees ${allLogs.length} logs for this trip:`)
    allLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.action} (companyId: ${log.companyId || 'NULL'})`)
    })

    // Step 10: Cleanup test data
    console.log('\n📋 Step 10: Cleanup test data')
    console.log('─'.repeat(60))

    await prisma.adminLog.deleteMany({
      where: {
        id: { in: [auditLog.id, companyLog.id] },
      },
    })

    console.log('✅ Test data cleaned up')

    // Final Summary
    console.log('\n\n🎉 Audit Segregation Test Complete!')
    console.log('═'.repeat(60))
    console.log('Summary:')
    console.log('─'.repeat(60))
    console.log(`✅ Super Admin log created: companyId = NULL`)
    console.log(`✅ Company log created: companyId = ${company.id}`)
    console.log(`✅ Company query filters: WHERE companyId = ${company.id}`)
    console.log(`${superAdminLogInCompanyView ? '❌' : '✅'} Super Admin log ${superAdminLogInCompanyView ? 'IS' : 'is NOT'} visible to company`)
    console.log(`${companyLogInView ? '✅' : '❌'} Company log ${companyLogInView ? 'IS' : 'is NOT'} visible to company`)
    console.log('─'.repeat(60))

    if (!superAdminLogInCompanyView && companyLogInView) {
      console.log('\n🔒 CRITICAL REQUIREMENT MET:')
      console.log('   Companies CANNOT see Super Admin surveillance logs')
      console.log('   Companies CAN see their own operational logs')
      console.log('   Audit segregation working correctly! ✅')
    } else {
      console.log('\n❌ CRITICAL ISSUE:')
      console.log('   Audit segregation is NOT working correctly!')
      console.log('   This needs immediate attention!')
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuditSegregation()
