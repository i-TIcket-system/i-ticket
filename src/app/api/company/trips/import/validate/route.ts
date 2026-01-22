/**
 * Trip Import Validation API
 * Validates uploaded CSV/XLSX file without creating trips
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseCSV } from '@/lib/import/csv-parser';
import { parseXLSX } from '@/lib/import/xlsx-parser';
import {
  validateColumns,
  validateAllRows,
  REQUIRED_COLUMNS,
} from '@/lib/import/trip-import-validator';
import { mapTripsToDatabase } from '@/lib/import/trip-import-mapper';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 50;

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json(
        { error: 'Only company admins can import trips' },
        { status: 403 }
      );
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Company ID not found' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xlsx'].includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Please upload .csv or .xlsx file (received: .${fileExtension || 'unknown'})`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: `File too large (${sizeMB}MB). Maximum allowed: 5MB. Try reducing rows or removing unnecessary data`,
        },
        { status: 400 }
      );
    }

    // Parse file
    let parseResult;

    if (fileExtension === 'csv') {
      const fileContent = await file.text();
      parseResult = parseCSV(fileContent);
    } else {
      // XLSX
      const arrayBuffer = await file.arrayBuffer();
      parseResult = await parseXLSX(arrayBuffer);
    }

    if (!parseResult.success || parseResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.errors.length > 0
            ? parseResult.errors
            : ['Cannot parse file. Ensure first row contains column headers and data is properly formatted'],
        },
        { status: 400 }
      );
    }

    // Validate row count
    if (parseResult.data.length > MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            `Maximum ${MAX_ROWS} trips per import. Your file has ${parseResult.data.length} rows. Split into multiple files.`,
          ],
        },
        { status: 400 }
      );
    }

    // Validate columns
    const headers = Object.keys(parseResult.data[0]);
    const columnErrors = validateColumns(headers);

    if (columnErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: columnErrors,
        },
        { status: 400 }
      );
    }

    // Validate all rows (schema validation)
    const validationResult = validateAllRows(parseResult.data);

    // If schema validation failed, return errors
    if (validationResult.hasErrors) {
      const allErrors = validationResult.validatedRows
        .filter((r) => !r.isValid)
        .flatMap((r) => r.errors);

      return NextResponse.json({
        success: false,
        validCount: validationResult.validCount,
        errorCount: validationResult.errorCount,
        errors: allErrors,
        validatedRows: validationResult.validatedRows,
      });
    }

    // Extract valid data for database mapping
    const validData = validationResult.validatedRows
      .filter((r) => r.isValid)
      .map((r) => r.data);

    // Map to database entities (staff, vehicles, cities)
    const mappingResult = await mapTripsToDatabase(
      validData,
      session.user.companyId
    );

    if (!mappingResult.success) {
      return NextResponse.json({
        success: false,
        validCount: validationResult.validCount,
        errorCount: mappingResult.errors.length,
        errors: mappingResult.errors,
        validatedRows: validationResult.validatedRows,
      });
    }

    // All validations passed
    return NextResponse.json({
      success: true,
      validCount: validationResult.validCount,
      errorCount: 0,
      errors: [],
      validatedRows: validationResult.validatedRows,
      mappedTrips: mappingResult.mappedTrips,
    });
  } catch (error) {
    console.error('Trip import validation error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      },
      { status: 500 }
    );
  }
}
