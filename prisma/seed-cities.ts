import { PrismaClient } from "@prisma/client"
import { ETHIOPIAN_CITIES } from "../src/lib/ethiopian-cities"

const prisma = new PrismaClient()

/**
 * Seed comprehensive list of Ethiopian cities
 * Run with: npx tsx prisma/seed-cities.ts
 */
async function seedCities() {
  console.log(`Seeding ${ETHIOPIAN_CITIES.length} Ethiopian cities...`)

  for (const cityName of ETHIOPIAN_CITIES) {
    await prisma.city.upsert({
      where: { name: cityName },
      update: {},
      create: {
        name: cityName,
        tripCount: 0,
        isActive: true,
      },
    })
  }

  const count = await prisma.city.count()
  console.log(`✓ Seeded ${count} Ethiopian cities`)
  console.log("Cities are now available for trip creation!")
}

seedCities()
  .catch((e) => {
    console.error("City seeding error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
