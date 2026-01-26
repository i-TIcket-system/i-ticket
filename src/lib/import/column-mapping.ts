/**
 * Smart Column Mapping
 * Auto-detects and maps user's column names to i-Ticket fields
 */

// i-Ticket required fields and their common aliases
export const COLUMN_ALIASES: Record<string, string[]> = {
  origin: [
    'origin', 'from', 'departure', 'departure city', 'from city',
    'start', 'starting point', 'pickup', 'pickup city', 'source',
    'መነሻ', 'ከ' // Amharic
  ],
  destination: [
    'destination', 'to', 'arrival', 'arrival city', 'to city',
    'end', 'ending point', 'dropoff', 'drop off', 'target',
    'መድረሻ', 'ወደ' // Amharic
  ],
  departureDate: [
    'departuredate', 'departure date', 'date', 'travel date',
    'trip date', 'journey date', 'depart date', 'dep date',
    'ቀን', 'የጉዞ ቀን' // Amharic
  ],
  departureTime: [
    'departuretime', 'departure time', 'time', 'travel time',
    'trip time', 'depart time', 'dep time', 'leave time', 'start time',
    'ሰዓት', 'የጉዞ ሰዓት' // Amharic
  ],
  estimatedDuration: [
    'estimatedduration', 'estimated duration', 'duration', 'travel time',
    'trip duration', 'journey time', 'hours', 'duration (min)', 'duration (minutes)',
    'ቆይታ' // Amharic
  ],
  price: [
    'price', 'fare', 'cost', 'ticket price', 'amount', 'fee',
    'price (etb)', 'fare (etb)', 'ticket cost',
    'ዋጋ' // Amharic
  ],
  busType: [
    'bustype', 'bus type', 'type', 'vehicle type', 'class',
    'service class', 'bus class', 'seat class',
    'የአውቶቡስ ዓይነት' // Amharic
  ],
  totalSlots: [
    'totalslots', 'total slots', 'seats', 'total seats', 'capacity',
    'available seats', 'seat count', 'no of seats', 'number of seats',
    'መቀመጫዎች' // Amharic
  ],
  driverPhone: [
    'driverphone', 'driver phone', 'driver', 'driver contact',
    'driver mobile', 'driver tel', 'driver number',
    'ሹፌር ስልክ' // Amharic
  ],
  conductorPhone: [
    'conductorphone', 'conductor phone', 'conductor', 'conductor contact',
    'conductor mobile', 'conductor tel', 'conductor number', 'assistant',
    'ረዳት ስልክ' // Amharic
  ],
  vehiclePlateNumber: [
    'vehicleplatenumber', 'vehicle plate number', 'plate number', 'plate',
    'vehicle plate', 'license plate', 'registration', 'reg number',
    'ታርጋ' // Amharic
  ],
  preparedBy: [
    'preparedby', 'prepared by', 'created by', 'author', 'submitter',
    'entered by', 'added by', 'user',
    'ያዘጋጀው' // Amharic
  ],
  // Optional fields
  distance: [
    'distance', 'km', 'kilometers', 'distance (km)', 'route distance',
    'ርቀት' // Amharic
  ],
  intermediateStops: [
    'intermediatestops', 'intermediate stops', 'stops', 'via', 'through',
    'waypoints', 'midpoints', 'stop points',
    'መካከለኛ ማቆሚያዎች' // Amharic
  ],
  hasWater: [
    'haswater', 'has water', 'water', 'water included', 'free water',
    'ውሃ' // Amharic
  ],
  hasFood: [
    'hasfood', 'has food', 'food', 'snacks', 'food included', 'meals',
    'ምግብ' // Amharic
  ],
  manualTicketerPhone: [
    'manualticketerphone', 'manual ticketer phone', 'ticketer phone',
    'ticketer', 'ticketer contact',
    'ቲኬት ሰሪ ስልክ' // Amharic
  ],
  driverName: [
    'drivername', 'driver name', 'driver full name',
    'ሹፌር ስም' // Amharic
  ],
  conductorName: [
    'conductorname', 'conductor name', 'conductor full name',
    'ረዳት ስም' // Amharic
  ],
  manualTicketerName: [
    'manualticketername', 'manual ticketer name', 'ticketer name',
    'ቲኬት ሰሪ ስም' // Amharic
  ],
  returnTripDate: [
    'returntripdate', 'return trip date', 'return date', 'back date',
    'የመመለሻ ቀን' // Amharic
  ],
  returnTripTime: [
    'returntriptime', 'return trip time', 'return time', 'back time',
    'የመመለሻ ሰዓት' // Amharic
  ],
};

// Required fields for import
export const REQUIRED_FIELDS = [
  'origin',
  'destination',
  'departureDate',
  'departureTime',
  'estimatedDuration',
  'price',
  'busType',
  'totalSlots',
  'driverPhone',
  'conductorPhone',
  'vehiclePlateNumber',
  'preparedBy',
];

export interface ColumnMapping {
  userColumn: string;
  iTicketField: string | null;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
}

export interface MappingResult {
  mappings: ColumnMapping[];
  unmappedRequired: string[];
  autoDetected: boolean;
  confidence: 'complete' | 'partial' | 'manual';
}

/**
 * Normalize column name for comparison
 * - Lowercase
 * - Remove special characters
 * - Trim whitespace
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u1200-\u137F]/g, '') // Keep alphanumeric and Amharic
    .trim();
}

/**
 * Calculate similarity score between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Create distance matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Find best matching i-Ticket field for a user column
 */
function findBestMatch(userColumn: string): { field: string | null; confidence: ColumnMapping['confidence'] } {
  const normalized = normalizeColumnName(userColumn);

  // Check for exact matches first
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      if (normalized === normalizedAlias) {
        return { field, confidence: 'exact' };
      }
    }
  }

  // Check for high-confidence partial matches (contains)
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        if (Math.abs(normalized.length - normalizedAlias.length) <= 5) {
          return { field, confidence: 'high' };
        }
      }
    }
  }

  // Check for fuzzy matches using similarity
  let bestMatch: { field: string; similarity: number } | null = null;

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      const similarity = calculateSimilarity(normalized, normalizedAlias);

      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { field, similarity };
      }
    }
  }

  if (bestMatch) {
    const confidence = bestMatch.similarity > 0.85 ? 'medium' : 'low';
    return { field: bestMatch.field, confidence };
  }

  return { field: null, confidence: 'none' };
}

/**
 * Auto-detect column mappings from user's headers
 */
export function autoDetectColumns(userHeaders: string[]): MappingResult {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  // First pass: find exact and high-confidence matches
  for (const header of userHeaders) {
    const { field, confidence } = findBestMatch(header);

    if (field && !usedFields.has(field) && (confidence === 'exact' || confidence === 'high')) {
      mappings.push({
        userColumn: header,
        iTicketField: field,
        confidence,
      });
      usedFields.add(field);
    }
  }

  // Second pass: find medium/low confidence matches for unmapped columns
  for (const header of userHeaders) {
    if (mappings.some(m => m.userColumn === header)) continue;

    const { field, confidence } = findBestMatch(header);

    if (field && !usedFields.has(field)) {
      mappings.push({
        userColumn: header,
        iTicketField: field,
        confidence,
      });
      usedFields.add(field);
    } else {
      mappings.push({
        userColumn: header,
        iTicketField: null,
        confidence: 'none',
      });
    }
  }

  // Find unmapped required fields
  const unmappedRequired = REQUIRED_FIELDS.filter(f => !usedFields.has(f));

  // Determine overall confidence
  let overallConfidence: MappingResult['confidence'];
  if (unmappedRequired.length === 0) {
    const allHighConfidence = mappings
      .filter(m => m.iTicketField && REQUIRED_FIELDS.includes(m.iTicketField))
      .every(m => m.confidence === 'exact' || m.confidence === 'high');
    overallConfidence = allHighConfidence ? 'complete' : 'partial';
  } else {
    overallConfidence = 'manual';
  }

  return {
    mappings,
    unmappedRequired,
    autoDetected: overallConfidence !== 'manual',
    confidence: overallConfidence,
  };
}

/**
 * Apply column mapping to transform user data to i-Ticket format
 */
export function applyMapping(
  data: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, string>[] {
  const fieldMap = new Map<string, string>();

  for (const mapping of mappings) {
    if (mapping.iTicketField) {
      fieldMap.set(mapping.userColumn, mapping.iTicketField);
    }
  }

  return data.map(row => {
    const transformed: Record<string, string> = {};

    for (const [userCol, value] of Object.entries(row)) {
      const iTicketField = fieldMap.get(userCol);
      if (iTicketField) {
        transformed[iTicketField] = value;
      }
    }

    return transformed;
  });
}

/**
 * Get user-friendly field description
 */
export function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    origin: 'Departure city (e.g., Addis Ababa)',
    destination: 'Arrival city (e.g., Hawassa)',
    departureDate: 'Travel date (YYYY-MM-DD)',
    departureTime: 'Departure time (HH:MM)',
    estimatedDuration: 'Trip duration in minutes',
    price: 'Ticket price in ETB',
    busType: 'Bus type (standard, luxury, mini)',
    totalSlots: 'Number of available seats',
    driverPhone: 'Driver phone (09XXXXXXXX)',
    conductorPhone: 'Conductor phone (09XXXXXXXX)',
    vehiclePlateNumber: 'Vehicle plate number',
    preparedBy: 'Name of person creating the import',
    distance: 'Distance in kilometers (optional)',
    intermediateStops: 'Comma-separated stop cities (optional)',
    hasWater: 'Water provided (true/false, optional)',
    hasFood: 'Food/snacks provided (true/false, optional)',
    manualTicketerPhone: 'Manual ticketer phone (optional)',
    driverName: 'Driver name for reference (optional)',
    conductorName: 'Conductor name for reference (optional)',
    manualTicketerName: 'Manual ticketer name (optional)',
    returnTripDate: 'Return trip date (optional)',
    returnTripTime: 'Return trip time (optional)',
  };

  return descriptions[field] || field;
}

/**
 * Validate that all required mappings are present
 */
export function validateMappings(mappings: ColumnMapping[]): {
  valid: boolean;
  missingFields: string[];
} {
  const mappedFields = new Set(
    mappings
      .filter(m => m.iTicketField)
      .map(m => m.iTicketField!)
  );

  const missingFields = REQUIRED_FIELDS.filter(f => !mappedFields.has(f));

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
