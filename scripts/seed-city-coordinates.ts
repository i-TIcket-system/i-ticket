/**
 * Seed Script: Ethiopian City GPS Coordinates
 *
 * Adds GPS coordinates to major Ethiopian cities for OsmAnd integration.
 * Run with: npx tsx scripts/seed-city-coordinates.ts
 *
 * Phase 1: GPS Telematics
 */

import prisma from '../src/lib/db'

// Major Ethiopian cities with GPS coordinates
const ETHIOPIAN_CITIES = [
  // Capital and major metropolitan areas
  {
    name: 'Addis Ababa',
    latitude: 9.022,
    longitude: 38.7468,
    region: 'Addis Ababa',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Dire Dawa',
    latitude: 9.601,
    longitude: 41.8661,
    region: 'Dire Dawa',
    timezone: 'Africa/Addis_Ababa',
  },

  // Major regional cities (by population)
  {
    name: 'Bahir Dar',
    latitude: 11.594,
    longitude: 37.3903,
    region: 'Amhara',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Hawassa',
    latitude: 7.062,
    longitude: 38.476,
    region: 'Sidama',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Mekelle',
    latitude: 13.4967,
    longitude: 39.4753,
    region: 'Tigray',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Gondar',
    latitude: 12.6,
    longitude: 37.4667,
    region: 'Amhara',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Jimma',
    latitude: 7.6773,
    longitude: 36.8344,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Adama',
    latitude: 8.54,
    longitude: 39.27,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Nazret', // Alternative name for Adama
    latitude: 8.54,
    longitude: 39.27,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Dessie',
    latitude: 11.13,
    longitude: 39.6333,
    region: 'Amhara',
    timezone: 'Africa/Addis_Ababa',
  },

  // Additional important cities
  {
    name: 'Jijiga',
    latitude: 9.35,
    longitude: 42.8,
    region: 'Somali',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Debre Markos',
    latitude: 10.35,
    longitude: 37.7167,
    region: 'Amhara',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Nekemte',
    latitude: 9.0833,
    longitude: 36.5333,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Debre Birhan',
    latitude: 9.6833,
    longitude: 39.5333,
    region: 'Amhara',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Asella',
    latitude: 7.9667,
    longitude: 39.1333,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Harar',
    latitude: 9.3133,
    longitude: 42.1175,
    region: 'Harari',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Sodo',
    latitude: 6.85,
    longitude: 37.75,
    region: 'Wolayta',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Arba Minch',
    latitude: 6.0333,
    longitude: 37.55,
    region: 'Southern Nations',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Hosanna',
    latitude: 7.55,
    longitude: 37.85,
    region: 'Southern Nations',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Debre Zeit',
    latitude: 8.75,
    longitude: 38.9833,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
  {
    name: 'Shashemene',
    latitude: 7.2,
    longitude: 38.6,
    region: 'Oromia',
    timezone: 'Africa/Addis_Ababa',
  },
]

async function seedCityCoordinates() {
  console.log('🌍 Starting city coordinates seeding...\n')

  let updated = 0
  let created = 0
  let skipped = 0

  for (const cityData of ETHIOPIAN_CITIES) {
    try {
      // Check if city exists
      const existingCity = await prisma.city.findFirst({
        where: { name: cityData.name },
      })

      if (existingCity) {
        // Update existing city with coordinates
        await prisma.city.update({
          where: { id: existingCity.id },
          data: {
            latitude: cityData.latitude,
            longitude: cityData.longitude,
            region: cityData.region,
            timezone: cityData.timezone,
          },
        })
        console.log(`✅ Updated: ${cityData.name} (${cityData.latitude}, ${cityData.longitude})`)
        updated++
      } else {
        // Create new city
        await prisma.city.create({
          data: {
            name: cityData.name,
            latitude: cityData.latitude,
            longitude: cityData.longitude,
            region: cityData.region,
            timezone: cityData.timezone,
            isActive: true,
            tripCount: 0,
          },
        })
        console.log(`🆕 Created: ${cityData.name} (${cityData.latitude}, ${cityData.longitude})`)
        created++
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${cityData.name}:`, error.message)
      skipped++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Seeding Summary:')
  console.log(`   ✅ Updated: ${updated} cities`)
  console.log(`   🆕 Created: ${created} cities`)
  console.log(`   ❌ Skipped: ${skipped} cities`)
  console.log(`   📍 Total: ${ETHIOPIAN_CITIES.length} cities processed`)
  console.log('='.repeat(60))

  // Show cities missing coordinates
  const citiesWithoutCoords = await prisma.city.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: { name: true, tripCount: true },
    orderBy: { tripCount: 'desc' },
    take: 10,
  })

  if (citiesWithoutCoords.length > 0) {
    console.log('\n⚠️  Cities still missing GPS coordinates (top 10 by trip count):')
    citiesWithoutCoords.forEach((city) => {
      console.log(`   - ${city.name} (${city.tripCount} trips)`)
    })
    console.log('\n   💡 Add these cities to the seed script for better coverage.')
  } else {
    console.log('\n✅ All cities have GPS coordinates!')
  }
}

async function main() {
  try {
    await seedCityCoordinates()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
