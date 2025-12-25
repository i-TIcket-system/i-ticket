import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * Seed initial major Ethiopian cities
 * Run with: npx tsx prisma/seed-cities.ts
 */
async function seedCities() {
  console.log("Seeding Ethiopian cities...")

  const majorCities = [
    // Major cities (Tier 1)
    { name: "Addis Ababa", region: "Addis Ababa" },
    { name: "Dire Dawa", region: "Dire Dawa" },

    // Regional capitals (Tier 2)
    { name: "Mekelle", region: "Tigray" },
    { name: "Bahir Dar", region: "Amhara" },
    { name: "Gondar", region: "Amhara" },
    { name: "Dessie", region: "Amhara" },
    { name: "Debre Markos", region: "Amhara" },
    { name: "Debre Birhan", region: "Amhara" },
    { name: "Hawassa", region: "Sidama" },
    { name: "Jimma", region: "Oromia" },
    { name: "Adama", region: "Oromia" },
    { name: "Nekemte", region: "Oromia" },
    { name: "Harar", region: "Harari" },
    { name: "Jijiga", region: "Somali" },
    { name: "Gambela", region: "Gambela" },
    { name: "Assosa", region: "Benishangul-Gumuz" },

    // Popular tourist destinations (Tier 3)
    { name: "Lalibela", region: "Amhara" },
    { name: "Axum", region: "Tigray" },
    { name: "Arba Minch", region: "SNNPR" },
    { name: "Sodo", region: "SNNPR" },

    // Additional major towns
    { name: "Debre Zeit", region: "Oromia" },
    { name: "Shashemene", region: "Oromia" },
    { name: "Dilla", region: "SNNPR" },
    { name: "Woldiya", region: "Amhara" },
    { name: "Kombolcha", region: "Amhara" },
    { name: "Adigrat", region: "Tigray" },
    { name: "Shashamane", region: "Oromia" },
    { name: "Bonga", region: "SNNPR" },
    { name: "Mizan Teferi", region: "SNNPR" },
    { name: "Semera", region: "Afar" },
  ]

  for (const city of majorCities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: { region: city.region },
      create: {
        name: city.name,
        region: city.region,
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
