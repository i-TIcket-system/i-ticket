import { PrismaClient } from "@prisma/client"
import { ETHIOPIAN_CITIES } from "../src/lib/ethiopian-cities"

const prisma = new PrismaClient()

async function checkCities() {
  console.log(`\n📋 ETHIOPIAN_CITIES array has ${ETHIOPIAN_CITIES.length} cities`)
  console.log(`First 10: ${ETHIOPIAN_CITIES.slice(0, 10).join(", ")}`)
  console.log(`Last 10: ${ETHIOPIAN_CITIES.slice(-10).join(", ")}`)

  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    select: { name: true }
  })

  console.log(`\n🗄️  Database has ${cities.length} cities`)
  console.log(`First 10: ${cities.slice(0, 10).map(c => c.name).join(", ")}`)
  console.log(`Last 10: ${cities.slice(-10).map(c => c.name).join(", ")}`)

  console.log(`\n📊 All cities in database:`)
  cities.forEach((city, i) => {
    console.log(`${i + 1}. ${city.name}`)
  })
}

checkCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
