import prisma from "../src/lib/db"

async function checkUsers() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, phone: true, email: true }
  })

  console.log(`Found ${customers.length} customer users:`)
  customers.forEach(user => {
    console.log(`  - ${user.name || "No name"} (${user.phone || user.email})`)
  })

  await prisma.$disconnect()
}

checkUsers()
