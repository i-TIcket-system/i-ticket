/**
 * Test script for commission calculation
 * Run with: npx tsx test-commission.ts
 */

import { calculateBookingAmounts, calculateCommission } from "./src/lib/commission"

console.log("=".repeat(60))
console.log("COMMISSION CALCULATION TEST")
console.log("=".repeat(60))

// Test Case 1: Single passenger
console.log("\n📋 Test Case 1: Single Passenger")
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
const expectedTotal = ticketPrice + 5 + 0.75 // 100 + 5 + 0.75 = 105.75
console.log(`\nExpected: ${expectedTotal} ETB`)
console.log(`Actual: ${singlePassenger.totalAmount} ETB`)
console.log(singlePassenger.totalAmount === Math.round(expectedTotal) ? "✅ PASS" : "❌ FAIL")

// Test Case 2: Multiple passengers
console.log("\n\n📋 Test Case 2: Multiple Passengers (3 passengers)")
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
const commissionFor3 = Math.round(ticketFor3 * 0.05) // 15
const vatFor3 = Math.round(commissionFor3 * 0.15) // 2.25 → 2
const expectedTotal3 = ticketFor3 + commissionFor3 + vatFor3 // 300 + 15 + 2 = 317
console.log(`\nExpected: ${expectedTotal3} ETB`)
console.log(`Actual: ${multiPassenger.totalAmount} ETB`)
console.log(multiPassenger.totalAmount === expectedTotal3 ? "✅ PASS" : "❌ FAIL")

// Test Case 3: Revenue breakdown
console.log("\n\n📋 Test Case 3: Revenue Breakdown")
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
