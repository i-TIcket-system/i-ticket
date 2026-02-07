/**
 * City landmarks and route suggestion helpers for pickup/dropoff selection.
 * Landmarks are well-known pickup/dropoff points within each city.
 */

export const CITY_LANDMARKS: Record<string, string[]> = {
  "Addis Ababa": [
    "Meskel Square",
    "Bole Airport",
    "Autobus Tera",
    "Megenagna",
    "Kaliti",
    "Saris",
    "CMC",
    "Lebu",
    "Torhailoch",
    "Ayer Tena",
    "Mexico Square",
    "Piassa",
    "Merkato",
  ],
  "Adama": ["Adama Bus Station", "Franko"],
  "Hawassa": ["Hawassa Bus Station", "Piassa", "Atote"],
  "Bahir Dar": ["Bahir Dar Bus Station", "St. George"],
  "Dire Dawa": ["Dire Dawa Bus Station", "Sabian"],
  "Jimma": ["Jimma Bus Station"],
  "Mekelle": ["Mekelle Bus Station"],
  "Gondar": ["Gondar Bus Station", "Piassa"],
  "Dessie": ["Dessie Bus Station"],
  "Bishoftu": ["Bishoftu Bus Station"],
  "Shashamane": ["Shashamane Bus Station"],
  "Arba Minch": ["Arba Minch Bus Station"],
  "Debre Markos": ["Debre Markos Bus Station"],
  "Harar": ["Harar Bus Station"],
  "Nekemte": ["Nekemte Bus Station"],
  "Woldia": ["Woldia Bus Station"],
}

export interface RouteSuggestion {
  label: string
  type: "stop" | "landmark"
}

/**
 * Build a flat list of suggestions for a given route (origin + stops + destination).
 * Returns stops first, then landmarks for each city on the route.
 */
export function buildRouteSuggestions(routeStops: string[]): RouteSuggestion[] {
  const suggestions: RouteSuggestion[] = []
  const seen = new Set<string>()

  for (const stop of routeStops) {
    if (!stop || seen.has(stop)) continue
    seen.add(stop)

    // Add the city itself as a stop
    suggestions.push({ label: stop, type: "stop" })

    // Add landmarks for this city
    const landmarks = CITY_LANDMARKS[stop]
    if (landmarks) {
      for (const lm of landmarks) {
        if (!seen.has(lm)) {
          seen.add(lm)
          suggestions.push({ label: lm, type: "landmark" })
        }
      }
    }
  }

  return suggestions
}
