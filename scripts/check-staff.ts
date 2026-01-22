import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkStaff() {
  const company = await prisma.company.findFirst({
    where: { name: "Selam Bus" }
  })

  if (!company) {
    console.log("Company not found")
    return
  }

  const staff = await prisma.user.findMany({
    where: {
      companyId: company.id,
      staffRole: { in: ["DRIVER", "CONDUCTOR", "MANUAL_TICKETER"] }
    },
    select: {
      name: true,
      phone: true,
      staffRole: true,
    }
  })

  console.log("\nSelam Bus Staff:")
  console.table(staff)
}

checkStaff().finally(() => prisma.$disconnect())
