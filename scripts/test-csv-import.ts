import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function testCSVImport() {
  console.log("🧪 Testing CSV Import Feature\n")
  console.log("=" .repeat(60))

  // Get Selam Bus company ID (we'll use their staff/vehicles)
  const company = await prisma.company.findFirst({
    where: { name: "Selam Bus" },
    include: {
      users: {
        where: {
          staffRole: { in: ["DRIVER", "CONDUCTOR", "MANUAL_TICKETER"] }
        }
      },
      vehicles: true,
    }
  })

  if (!company) {
    console.log("❌ Selam Bus company not found!")
    return
  }

  console.log("\n✅ Company Found: Selam Bus")
  console.log(`   Company ID: ${company.id}`)
  console.log(`   Staff Count: ${company.users.length}`)
  console.log(`   Vehicle Count: ${company.vehicles.length}`)

  // Check if test CSV file exists
  const testCsvPath = path.join(process.cwd(), "test-data", "trip-import-valid.csv")
  if (!fs.existsSync(testCsvPath)) {
    console.log("\n❌ Test CSV file not found:", testCsvPath)
    return
  }

  console.log("\n✅ Test CSV File Found")
  console.log(`   Path: ${testCsvPath}`)

  // Read CSV content
  const csvContent = fs.readFileSync(testCsvPath, "utf-8")
  const lines = csvContent.trim().split("\n")
  console.log(`   Rows: ${lines.length - 1} trips (excluding header)`)

  // Parse first data row to show format
  const header = lines[0].split(",")
  const firstRow = lines[1].split(",")
  console.log("\n📋 Sample Trip (Row 1):")
  header.forEach((col, idx) => {
    if (firstRow[idx]) {
      console.log(`   ${col}: ${firstRow[idx]}`)
    }
  })

  // Validate staff phones exist
  console.log("\n🔍 Validating Staff Phones:")
  const driverPhone = firstRow[header.indexOf("driverPhone")]
  const conductorPhone = firstRow[header.indexOf("conductorPhone")]

  const driver = company.users.find(u => u.phone === driverPhone && u.staffRole === "DRIVER")
  const conductor = company.users.find(u => u.phone === conductorPhone && u.staffRole === "CONDUCTOR")

  console.log(`   Driver (${driverPhone}): ${driver ? "✅ Found" : "❌ Not found"}`)
  console.log(`   Conductor (${conductorPhone}): ${conductor ? "✅ Found" : "❌ Not found"}`)

  // Validate vehicle plate
  const vehiclePlate = firstRow[header.indexOf("vehiclePlateNumber")]
  const vehicle = company.vehicles.find(v => v.plateNumber === vehiclePlate)
  console.log(`   Vehicle (${vehiclePlate}): ${vehicle ? `✅ Found (${vehicle.totalSeats} seats)` : "❌ Not found"}`)

  // Check 24-hour rule (trips in CSV should be at least 24 hours apart for same staff/vehicle)
  console.log("\n⏱️  24-Hour Rule Check:")
  console.log("   Checking if same driver/vehicle is used within 24 hours...")

  const trips = lines.slice(1).map(line => {
    const values = line.split(",")
    return {
      date: values[header.indexOf("departureDate")],
      time: values[header.indexOf("departureTime")],
      driverPhone: values[header.indexOf("driverPhone")],
      vehiclePlate: values[header.indexOf("vehiclePlateNumber")],
    }
  })

  let has24HourViolation = false
  for (let i = 0; i < trips.length - 1; i++) {
    for (let j = i + 1; j < trips.length; j++) {
      const trip1 = trips[i]
      const trip2 = trips[j]

      if (trip1.driverPhone === trip2.driverPhone || trip1.vehiclePlate === trip2.vehiclePlate) {
        const date1 = new Date(`${trip1.date}T${trip1.time}`)
        const date2 = new Date(`${trip2.date}T${trip2.time}`)
        const hoursDiff = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60)

        if (hoursDiff < 24) {
          console.log(`   ❌ Violation: ${trip1.driverPhone || trip1.vehiclePlate} used within ${hoursDiff.toFixed(1)} hours`)
          has24HourViolation = true
        }
      }
    }
  }

  if (!has24HourViolation) {
    console.log("   ✅ No 24-hour violations detected")
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("\n📊 Test Summary:")
  console.log("   To fully test the import, you would:")
  console.log("   1. Start the Next.js dev server (npm run dev)")
  console.log("   2. Login as Selam Bus Admin (0922345678 / demo123)")
  console.log("   3. Navigate to /company/trips/import")
  console.log("   4. Upload the test CSV file")
  console.log("   5. Review validation results")
  console.log("   6. Confirm import")
  console.log("\n   Or use the API directly:")
  console.log("   POST /api/company/trips/import")
  console.log("   with multipart/form-data containing the CSV file")
}

testCSVImport()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
