/**
 * Trip Import Validator
 * Validates CSV/XLSX rows for trip import
 */

import { z } from 'zod';
import { ParsedRow } from './csv-parser';

// Required columns in the CSV/XLSX
export const REQUIRED_COLUMNS = [
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

// Optional columns
export const OPTIONAL_COLUMNS = [
  'distance',
  'intermediateStops',
  'hasWater',
  'hasFood',
  'manualTicketerPhone',
  'manualTicketerName', // NEW - informational only
  'driverName', // NEW - informational only
  'conductorName', // NEW - informational only
  'returnTripDate',
  'returnTripTime',
];

export interface ValidationError {
  row: number; // 1-indexed (matches Excel)
  field: string;
  message: string;
}

export interface ValidatedRow {
  row: number;
  data: TripImportData;
  errors: ValidationError[];
  isValid: boolean;
}

export interface TripImportData {
  // Required fields
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  estimatedDuration: number; // minutes
  price: number; // ETB
  busType: 'standard' | 'luxury' | 'mini';
  totalSlots: number;
  driverPhone: string; // 09XXXXXXXX
  conductorPhone: string; // 09XXXXXXXX
  vehiclePlateNumber: string;
  preparedBy: string;

  // Optional fields
  distance?: number; // kilometers
  intermediateStops?: string[]; // array of city names
  hasWater?: boolean;
  hasFood?: boolean;
  manualTicketerPhone?: string; // 09XXXXXXXX
  manualTicketerName?: string; // NEW - informational only
  driverName?: string; // NEW - informational only
  conductorName?: string; // NEW - informational only
  returnTripDate?: string; // YYYY-MM-DD
  returnTripTime?: string; // HH:MM
}

// Zod schema for validating each row
const tripImportSchema = z.object({
  // Required fields
  origin: z.string().min(1, 'Origin city is required').max(100),
  destination: z.string().min(1, 'Destination city is required').max(100),
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  departureTime: z
    .string()
    .regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24-hour)'),
  estimatedDuration: z
    .number()
    .int('Must be whole number')
    .min(30, 'Minimum 30 minutes')
    .max(2880, 'Maximum 48 hours (2880 minutes)'),
  price: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Maximum price is 100,000 ETB'),
  busType: z.enum(['standard', 'luxury', 'mini'], {
    errorMap: () => ({ message: 'Must be one of: standard, luxury, mini' }),
  }),
  totalSlots: z
    .number()
    .int('Must be whole number')
    .min(4, 'Minimum 4 seats')
    .max(100, 'Maximum 100 seats'),
  driverPhone: z
    .string()
    .regex(/^09\d{8}$/, 'Invalid format. Required: 09XXXXXXXX (Ethiopian format)'),
  conductorPhone: z
    .string()
    .regex(/^09\d{8}$/, 'Invalid format. Required: 09XXXXXXXX (Ethiopian format)'),
  vehiclePlateNumber: z.string().min(1, 'Vehicle plate number is required').max(50),
  preparedBy: z.string().min(1, 'PreparedBy field is required').max(100),

  // Optional fields
  distance: z
    .number()
    .int('Must be whole number')
    .positive('Distance must be positive')
    .optional(),
  intermediateStops: z.array(z.string()).optional(),
  hasWater: z.boolean().optional(),
  hasFood: z.boolean().optional(),
  manualTicketerPhone: z
    .string()
    .regex(/^09\d{8}$/, 'Invalid format. Required: 09XXXXXXXX (Ethiopian format)')
    .optional(),
  // Optional name fields (informational only)
  driverName: z.string().max(100).optional(),
  conductorName: z.string().max(100).optional(),
  manualTicketerName: z.string().max(100).optional(),
  returnTripDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  returnTripTime: z
    .string()
    .regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24-hour)')
    .optional(),
});

/**
 * Transform CSV string values to proper types
 */
function transformRow(row: ParsedRow): Partial<TripImportData> {
  const transformed: any = { ...row };

  // Transform numbers
  if (row.estimatedDuration) {
    const duration = parseInt(row.estimatedDuration, 10);
    transformed.estimatedDuration = isNaN(duration) ? row.estimatedDuration : duration;
  }

  if (row.price) {
    const price = parseFloat(row.price);
    transformed.price = isNaN(price) ? row.price : price;
  }

  if (row.totalSlots) {
    const slots = parseInt(row.totalSlots, 10);
    transformed.totalSlots = isNaN(slots) ? row.totalSlots : slots;
  }

  if (row.distance) {
    const distance = parseInt(row.distance, 10);
    transformed.distance = isNaN(distance) ? row.distance : distance;
  }

  // Transform booleans (handle TRUE/FALSE, true/false, 1/0, yes/no)
  if (row.hasWater !== undefined && row.hasWater !== '') {
    const val = row.hasWater.toLowerCase();
    transformed.hasWater = val === 'true' || val === '1' || val === 'yes';
  }

  if (row.hasFood !== undefined && row.hasFood !== '') {
    const val = row.hasFood.toLowerCase();
    transformed.hasFood = val === 'true' || val === '1' || val === 'yes';
  }

  // Transform intermediate stops (comma-separated string to array)
  if (row.intermediateStops && row.intermediateStops.trim() !== '') {
    transformed.intermediateStops = row.intermediateStops
      .split(',')
      .map((stop) => stop.trim())
      .filter((stop) => stop !== '');
  }

  // Normalize busType to lowercase
  if (row.busType) {
    transformed.busType = row.busType.toLowerCase();
  }

  // Normalize phone numbers (handle +251 country code)
  if (row.driverPhone) {
    transformed.driverPhone = normalizePhone(row.driverPhone);
  }

  if (row.conductorPhone) {
    transformed.conductorPhone = normalizePhone(row.conductorPhone);
  }

  if (row.manualTicketerPhone) {
    transformed.manualTicketerPhone = normalizePhone(row.manualTicketerPhone);
  }

  // Normalize time format (add leading zeros: 8:00 → 08:00)
  if (row.departureTime) {
    transformed.departureTime = normalizeTime(row.departureTime);
  }

  if (row.returnTripTime) {
    transformed.returnTripTime = normalizeTime(row.returnTripTime);
  }

  return transformed;
}

/**
 * Normalize Ethiopian phone number
 * Handles formats: 09XXXXXXXX, +25109XXXXXXXX, 25109XXXXXXXX
 */
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle +25109XXXXXXXX or 25109XXXXXXXX
  if (digits.startsWith('251') && digits.length === 12) {
    return '0' + digits.slice(3); // 25109XXXXXXXX → 09XXXXXXXX
  }

  // Already in correct format or invalid (will be caught by validation)
  return digits.startsWith('0') ? digits : '0' + digits;
}

/**
 * Normalize time format to HH:MM (add leading zero if needed)
 * Handles formats: 8:00 → 08:00, 08:00 → 08:00, 23:45 → 23:45
 */
function normalizeTime(time: string): string {
  // Trim whitespace
  const trimmed = time.trim();

  // Match time pattern (allows single or double-digit hours)
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return trimmed; // Return as-is if invalid format (will be caught by validation)
  }

  const hours = match[1].padStart(2, '0'); // Add leading zero if needed
  const minutes = match[2];

  return `${hours}:${minutes}`;
}

/**
 * Validate required columns are present in CSV
 */
export function validateColumns(headers: string[]): string[] {
  const errors: string[] = [];
  const missingColumns: string[] = [];

  REQUIRED_COLUMNS.forEach((col) => {
    if (!headers.includes(col)) {
      missingColumns.push(col);
    }
  });

  if (missingColumns.length > 0) {
    errors.push(
      `Missing required column${missingColumns.length > 1 ? 's' : ''}: ${missingColumns.join(', ')}. Download template to see correct format`
    );
  }

  return errors;
}

/**
 * Validate a single row from CSV/XLSX
 */
export function validateRow(row: ParsedRow, rowNumber: number): ValidatedRow {
  const errors: ValidationError[] = [];

  // Transform string values to proper types
  const transformed = transformRow(row);

  // Validate with Zod schema
  const result = tripImportSchema.safeParse(transformed);

  if (!result.success) {
    result.error.errors.forEach((error) => {
      errors.push({
        row: rowNumber,
        field: error.path[0] as string,
        message: error.message,
      });
    });
  }

  // Additional business validations (only if schema validation passed)
  if (result.success) {
    const data = result.data as TripImportData;

    // Validate origin and destination are different
    if (data.origin.toLowerCase() === data.destination.toLowerCase()) {
      errors.push({
        row: rowNumber,
        field: 'destination',
        message: 'Destination must be different from origin',
      });
    }

    // Validate departure date is in the future
    const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
    if (departureDateTime <= new Date()) {
      errors.push({
        row: rowNumber,
        field: 'departureDate',
        message: `Date must be in future. Change '${data.departureDate}' to a date after today`,
      });
    }

    // Validate return trip date is after departure date
    if (data.returnTripDate) {
      if (!data.returnTripTime) {
        errors.push({
          row: rowNumber,
          field: 'returnTripTime',
          message: 'Return trip time is required when return trip date is specified',
        });
      } else {
        const returnDateTime = new Date(`${data.returnTripDate}T${data.returnTripTime}`);
        if (returnDateTime <= departureDateTime) {
          errors.push({
            row: rowNumber,
            field: 'returnTripDate',
            message: 'Return date must be after departure date',
          });
        }
      }
    }

    // Validate driver and conductor are different
    if (data.driverPhone === data.conductorPhone) {
      errors.push({
        row: rowNumber,
        field: 'conductorPhone',
        message: 'Driver and conductor must be different people',
      });
    }

    // Validate manual ticketer (if provided) is different from driver/conductor
    if (data.manualTicketerPhone) {
      if (data.manualTicketerPhone === data.driverPhone) {
        errors.push({
          row: rowNumber,
          field: 'manualTicketerPhone',
          message: 'Manual ticketer must be different from driver',
        });
      }
      if (data.manualTicketerPhone === data.conductorPhone) {
        errors.push({
          row: rowNumber,
          field: 'manualTicketerPhone',
          message: 'Manual ticketer must be different from conductor',
        });
      }
    }
  }

  return {
    row: rowNumber,
    data: (result.success ? result.data : transformed) as TripImportData,
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Validate all rows from CSV/XLSX
 */
export function validateAllRows(data: ParsedRow[]): {
  validatedRows: ValidatedRow[];
  validCount: number;
  errorCount: number;
  hasErrors: boolean;
} {
  const validatedRows = data.map((row, index) => validateRow(row, index + 2)); // +2 because row 1 is header, and Excel is 1-indexed

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const errorCount = validatedRows.filter((r) => !r.isValid).length;

  return {
    validatedRows,
    validCount,
    errorCount,
    hasErrors: errorCount > 0,
  };
}
