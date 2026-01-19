import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findTestUser() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, name: true, phone: true },
    take: 5,
  })

  console.log('Available test users:')
  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.name} (${user.phone})`)
  })

  await prisma.$disconnect()
}

findTestUser()
