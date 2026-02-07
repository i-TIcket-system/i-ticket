/**
 * Fuzzy string matching utilities
 * Extracted from Telegram bot booking-wizard.ts for reuse
 */

export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        )
      }
    }
  }

  return dp[m][n]
}

export interface FuzzyResult {
  value: string
  score: number
}

/**
 * Fuzzy match a query against a list of candidates.
 * Scoring (lower = better):
 *  - Exact match (case-insensitive): -10
 *  - Prefix match: -5
 *  - Contains substring: -3
 *  - Word-level prefix: -2
 *  - Levenshtein ≤ 3: distance value
 *  - No match: excluded
 */
export function fuzzyMatch(
  query: string,
  candidates: string[],
  maxResults = 10
): FuzzyResult[] {
  if (!query || query.trim().length === 0) return []

  const q = query.toLowerCase().trim()
  const results: FuzzyResult[] = []

  for (const candidate of candidates) {
    const c = candidate.toLowerCase()

    if (c === q) {
      results.push({ value: candidate, score: -10 })
    } else if (c.startsWith(q)) {
      results.push({ value: candidate, score: -5 })
    } else if (c.includes(q)) {
      results.push({ value: candidate, score: -3 })
    } else {
      // Check word-level prefix ("aye" matches "Ayer Tena")
      const words = c.split(/\s+/)
      const wordMatch = words.some((w) => w.startsWith(q))
      if (wordMatch) {
        results.push({ value: candidate, score: -2 })
      } else {
        const dist = levenshteinDistance(q, c)
        if (dist <= 3) {
          results.push({ value: candidate, score: dist })
        }
      }
    }
  }

  results.sort((a, b) => a.score - b.score)
  return results.slice(0, maxResults)
}
