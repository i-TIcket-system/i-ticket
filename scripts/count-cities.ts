import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function countCities() {
  const total = await prisma.city.count()
  const active = await prisma.city.count({ where: { isActive: true } })
  const inactive = await prisma.city.count({ where: { isActive: false } })

  console.log(`Total cities in database: ${total}`)
  console.log(`Active cities: ${active}`)
  console.log(`Inactive cities: ${inactive}`)

  // Get all city names
  const allCities = await prisma.city.findMany({
    select: { name: true, isActive: true },
    orderBy: { name: 'asc' }
  })

  console.log(`\nAll ${allCities.length} cities:`)
  allCities.forEach((city, i) => {
    console.log(`${i + 1}. ${city.name} ${!city.isActive ? '(INACTIVE)' : ''}`)
  })
}

countCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
