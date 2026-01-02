import prisma from "@/lib/db"

/**
 * Helper function to ensure a city exists in database
 * Called internally when creating trips
 */
export async function ensureCityExists(cityName: string): Promise<void> {
  if (!cityName || cityName.trim() === "") return

  const normalizedName = cityName.trim()

  // Check if city already exists
  const existing = await prisma.city.findUnique({
    where: { name: normalizedName }
  })

  if (!existing) {
    // Create new city
    await prisma.city.create({
      data: {
        name: normalizedName,
        tripCount: 1,
      }
    })

    console.log(`[CITY] New city added to registry: ${normalizedName}`)
  } else {
    // Increment trip count for existing city
    await prisma.city.update({
      where: { name: normalizedName },
      data: {
        tripCount: { increment: 1 }
      }
    })
  }
}
