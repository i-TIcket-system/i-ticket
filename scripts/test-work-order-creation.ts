import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testWorkOrderCreation() {
  console.log("Testing Work Order Creation...\n")

  try {
    // 1. Get a vehicle from Selam Bus
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        company: {
          name: "Selam Bus"
        }
      },
      include: {
        company: true
      }
    })

    if (!vehicle) {
      console.error("❌ No vehicle found for Selam Bus")
      return
    }

    console.log(`✅ Found vehicle: ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`)

    // 2. Get a mechanic from Selam Bus
    const mechanic = await prisma.user.findFirst({
      where: {
        companyId: vehicle.companyId,
        staffRole: "MECHANIC"
      }
    })

    if (!mechanic) {
      console.log("⚠️  No mechanic found, creating work order without assignment")
    } else {
      console.log(`✅ Found mechanic: ${mechanic.name}`)
    }

    // 3. Create a test work order
    const workOrderNumber = `WO-TEST-${Date.now().toString(36).toUpperCase()}`

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        vehicleId: vehicle.id,
        companyId: vehicle.companyId,
        title: "Test Oil Change",
        description: "Routine oil change and filter replacement - 10W-40 synthetic oil",
        taskType: "PREVENTIVE",
        priority: 2, // Normal
        assignedToId: mechanic?.id || null,
        assignedToName: mechanic?.name || null,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        odometerAtService: vehicle.currentOdometer,
        status: "OPEN"
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
            make: true,
            model: true
          }
        }
      }
    })

    console.log("\n✅ Work Order Created Successfully!")
    console.log("═".repeat(50))
    console.log(`Work Order Number: ${workOrder.workOrderNumber}`)
    console.log(`Title: ${workOrder.title}`)
    console.log(`Vehicle: ${workOrder.vehicle.plateNumber} - ${workOrder.vehicle.make} ${workOrder.vehicle.model}`)
    console.log(`Task Type: ${workOrder.taskType}`)
    console.log(`Priority: ${workOrder.priority} (${["", "Low", "Normal", "High", "Urgent"][workOrder.priority]})`)
    console.log(`Status: ${workOrder.status}`)
    console.log(`Assigned To: ${workOrder.assignedToName || "Unassigned"}`)
    console.log(`Scheduled: ${workOrder.scheduledDate?.toLocaleDateString()}`)
    console.log(`Description: ${workOrder.description}`)
    console.log("═".repeat(50))

    // 4. Verify we can fetch it back
    const fetchedWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: {
        vehicle: true,
        messages: true
      }
    })

    if (fetchedWorkOrder) {
      console.log("\n✅ Work Order can be fetched from database")
      console.log(`   ID: ${fetchedWorkOrder.id}`)
      console.log(`   Messages: ${fetchedWorkOrder.messages.length}`)
    }

    // 5. Get count of all work orders
    const totalWorkOrders = await prisma.workOrder.count()
    console.log(`\n📊 Total Work Orders in database: ${totalWorkOrders}`)

    // 6. Test creating a message in the work order
    const message = await prisma.workOrderMessage.create({
      data: {
        workOrderId: workOrder.id,
        senderId: mechanic?.id || "system",
        senderName: mechanic?.name || "System",
        senderRole: "MECHANIC",
        message: "Work order received. Will start on scheduled date.",
        type: "TEXT"
      }
    })

    console.log("\n✅ Test message created in work order")
    console.log(`   Message: "${message.message}"`)

    console.log("\n✨ All tests passed! Work order system is working correctly.")

  } catch (error) {
    console.error("\n❌ Error during test:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testWorkOrderCreation()
  .then(() => {
    console.log("\n✅ Test completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  })
