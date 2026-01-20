import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setPassword() {
  const hashedPassword = await bcrypt.hash('test123', 10)
  await prisma.user.update({
    where: { phone: '0900000000' },
    data: { password: hashedPassword }
  })
  console.log('✅ Password set for test user')
  console.log('   Phone: 0900000000')
  console.log('   Password: test123')
  await prisma.$disconnect()
}

setPassword()
