/**
 * Comprehensive list of major Ethiopian cities
 * Used as autocomplete suggestions when users search for trips
 * Organized by region for better coverage
 */

export const ETHIOPIAN_CITIES = [
  // Addis Ababa & Central
  "Addis Ababa",
  "Adama", // Nazret
  "Bishoftu", // Debre Zeit
  "Sebeta",
  "Dukem",
  "Gelan",
  "Mojo",
  "Holeta",

  // Amhara Region
  "Bahir Dar",
  "Gondar",
  "Dessie",
  "Debre Birhan",
  "Debre Markos",
  "Kombolcha",
  "Lalibela",
  "Woldiya",
  "Debre Tabor",
  "Finote Selam",
  "Bichena",
  "Gohatsion",
  "Kemise",
  "Dejen",
  "Alem Ketema",
  "Mersa",
  "Bati",

  // Oromia Region
  "Jimma",
  "Nekemte",
  "Ambo",
  "Harar",
  "Dire Dawa",
  "Asella",
  "Shashemene",
  "Hawassa",
  "Sodo",
  "Arba Minch",
  "Wolaita Sodo",
  "Hosanna",
  "Bale Robe",
  "Goba",
  "Dodola",
  "Dilla",
  "Yirgalem",
  "Bonga",
  "Mizan Teferi",
  "Tepi",
  "Metu",
  "Gore",
  "Bedele",
  "Gimbi",
  "Dembi Dolo",
  "Asosa",
  "Chiro",
  "Haramaya",
  "Jijiga",

  // Southern Region
  "Areka",
  "Durame",
  "Hosaena",
  "Butajira",
  "Welkite",
  "Worabe",
  "Bonga",

  // Tigray Region
  "Mekelle",
  "Axum",
  "Adigrat",
  "Shire",
  "Adwa",
  "Wukro",

  // Somali Region
  "Jijiga",
  "Gode",
  "Kebri Dahar",
  "Degehabur",

  // Afar Region
  "Semera",
  "Awash",
  "Gewane",

  // Benishangul-Gumuz
  "Assosa",
  "Bambasi",

  // Gambela Region
  "Gambela",

  // Popular Routes (towns along highways)
  "Modjo",
  "Koka",
  "Metehara",
  "Awash 7 Kilo",
  "Mieso",
  "Assebot",
  "Huruta",
  "Iteya",
  "Welenchiti",
  "Sendafa",
  "Chancho",
  "Debre Sina",
  "Ataye",
  "Harbu",
  "Makana Selam"
]

/**
 * Get all unique cities (database + static list)
 * @param dbCities Cities from database
 * @returns Combined and sorted list of unique cities
 */
export function getAllCities(dbCities: string[]): string[] {
  const combined = new Set([...ETHIOPIAN_CITIES, ...dbCities])
  return Array.from(combined).sort()
}
