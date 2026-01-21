/**
 * Test script for commission calculation
 * Run with: npx tsx test-commission.ts
 */

import { calculateBookingAmounts, calculateCommission } from "./src/lib/commission"

console.log("=".repeat(60))
console.log("COMMISSION CALCULATION TEST")
console.log("=".repeat(60))

// Test Case 1: Single passenger (100 ETB)
console.log("\n📋 Test Case 1: Single Passenger (100 ETB)")
console.log("-".repeat(60))
const ticketPrice = 100
const singlePassenger = calculateBookingAmounts(ticketPrice, 1)

console.log(`Ticket price per passenger: ${ticketPrice} ETB`)
console.log(`Number of passengers: 1`)
console.log(`\nTicket total: ${singlePassenger.ticketTotal} ETB (company receives)`)
console.log(`Base commission (5%): ${singlePassenger.commission.baseCommission} ETB`)
console.log(`VAT on commission (15%): ${singlePassenger.commission.vat} ETB`)
console.log(`Total commission: ${singlePassenger.commission.totalCommission} ETB (platform receives)`)
console.log(`\n✅ PASSENGER PAYS: ${singlePassenger.totalAmount} ETB`)
console.log(`   = ${singlePassenger.ticketTotal} (ticket) + ${singlePassenger.commission.totalCommission} (commission + VAT)`)

// Verify calculation
const expectedCommission1 = 100 * 0.05 // 5
const expectedVAT1 = expectedCommission1 * 0.15 // 0.75
const expectedTotal1 = 100 + expectedCommission1 + expectedVAT1 // 105.75
console.log(`\nExpected: Commission ${expectedCommission1}, VAT ${expectedVAT1}, Total ${expectedTotal1} ETB`)
console.log(`Actual:   Commission ${singlePassenger.commission.baseCommission}, VAT ${singlePassenger.commission.vat}, Total ${singlePassenger.totalAmount} ETB`)
console.log(singlePassenger.totalAmount === expectedTotal1 ? "✅ PASS" : "❌ FAIL")

// Test Case 2: Multiple passengers (3 passengers, 100 ETB each)
console.log("\n\n📋 Test Case 2: Multiple Passengers (3 × 100 ETB)")
console.log("-".repeat(60))
const multiPassenger = calculateBookingAmounts(ticketPrice, 3)

console.log(`Ticket price per passenger: ${ticketPrice} ETB`)
console.log(`Number of passengers: 3`)
console.log(`\nTicket total: ${multiPassenger.ticketTotal} ETB (company receives)`)
console.log(`Base commission (5%): ${multiPassenger.commission.baseCommission} ETB`)
console.log(`VAT on commission (15%): ${multiPassenger.commission.vat} ETB`)
console.log(`Total commission: ${multiPassenger.commission.totalCommission} ETB (platform receives)`)
console.log(`\n✅ PASSENGER PAYS: ${multiPassenger.totalAmount} ETB`)
console.log(`   = ${multiPassenger.ticketTotal} (ticket) + ${multiPassenger.commission.totalCommission} (commission + VAT)`)

// Verify calculation
const ticketFor3 = ticketPrice * 3 // 300
const commissionFor3 = ticketFor3 * 0.05 // 15
const vatFor3 = commissionFor3 * 0.15 // 2.25
const expectedTotal3 = ticketFor3 + commissionFor3 + vatFor3 // 317.25
console.log(`\nExpected: Commission ${commissionFor3}, VAT ${vatFor3}, Total ${expectedTotal3} ETB`)
console.log(`Actual:   Commission ${multiPassenger.commission.baseCommission}, VAT ${multiPassenger.commission.vat}, Total ${multiPassenger.totalAmount} ETB`)
console.log(multiPassenger.totalAmount === expectedTotal3 ? "✅ PASS" : "❌ FAIL")

// Test Case 3: Real example from user (850 ETB)
console.log("\n\n📋 Test Case 3: Real Example (850 ETB)")
console.log("-".repeat(60))
const realExample = calculateBookingAmounts(850, 1)

console.log(`Ticket price: 850 ETB`)
console.log(`Number of passengers: 1`)
console.log(`\nTicket total: ${realExample.ticketTotal} ETB (company receives)`)
console.log(`Base commission (5%): ${realExample.commission.baseCommission} ETB`)
console.log(`VAT on commission (15%): ${realExample.commission.vat} ETB`)
console.log(`Total commission: ${realExample.commission.totalCommission} ETB (platform receives)`)
console.log(`\n✅ PASSENGER PAYS: ${realExample.totalAmount} ETB`)
console.log(`   = ${realExample.ticketTotal} (ticket) + ${realExample.commission.totalCommission} (commission + VAT)`)

// Verify calculation (user's example)
const expectedCommission850 = 850 * 0.05 // 42.5
const expectedVAT850 = expectedCommission850 * 0.15 // 6.375
const expectedTotal850 = 850 + expectedCommission850 + expectedVAT850 // 898.875
console.log(`\nExpected: Commission ${expectedCommission850}, VAT ${expectedVAT850}, Total ${expectedTotal850} ETB`)
console.log(`Actual:   Commission ${realExample.commission.baseCommission}, VAT ${realExample.commission.vat}, Total ${realExample.totalAmount} ETB`)
console.log(realExample.totalAmount === expectedTotal850 ? "✅ PASS" : "❌ FAIL")

// Test Case 4: Revenue breakdown
console.log("\n\n📋 Test Case 4: Revenue Breakdown")
console.log("-".repeat(60))
console.log(`Total paid by passengers: ${multiPassenger.totalAmount} ETB`)
console.log(`Revenue to company: ${multiPassenger.ticketTotal} ETB (${((multiPassenger.ticketTotal / multiPassenger.totalAmount) * 100).toFixed(1)}%)`)
console.log(`Revenue to platform: ${multiPassenger.commission.totalCommission} ETB (${((multiPassenger.commission.totalCommission / multiPassenger.totalAmount) * 100).toFixed(1)}%)`)

// Verify sum
const sumCheck = multiPassenger.ticketTotal + multiPassenger.commission.totalCommission
console.log(`\nSum check: ${multiPassenger.ticketTotal} + ${multiPassenger.commission.totalCommission} = ${sumCheck} ETB`)
console.log(sumCheck === multiPassenger.totalAmount ? "✅ PASS - Sum is correct" : "❌ FAIL - Sum mismatch")

console.log("\n" + "=".repeat(60))
console.log("TEST COMPLETE")
console.log("=".repeat(60))
