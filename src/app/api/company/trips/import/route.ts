/**
 * Trip Import API
 * Creates trips from validated CSV/XLSX file
 * Supports smart column auto-detection and custom mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseCSV } from '@/lib/import/csv-parser';
import { parseXLSX } from '@/lib/import/xlsx-parser';
import {
  validateColumns,
  validateAllRows,
  REQUIRED_COLUMNS,
} from '@/lib/import/trip-import-validator';
import { mapTripsToDatabase, MappedTrip } from '@/lib/import/trip-import-mapper';
import {
  autoDetectColumns,
  applyMapping,
  ColumnMapping,
} from '@/lib/import/column-mapping';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 50;
const TRANSACTION_TIMEOUT = 15000; // 15 seconds

/**
 * Helper: Create datetime from date and time strings
 */
function createDateTime(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const [hours, minutes] = timeStr.split(':').map((num) => parseInt(num, 10));
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Helper: Check 24-hour conflicts for staff and vehicle
 */
async function checkConflicts(
  departureTime: Date,
  driverId: string,
  conductorId: string,
  vehicleId: string,
  companyId: string,
  manualTicketerId?: string
): Promise<string[]> {
  const conflicts: string[] = [];

  // Check 24 hours before and after
  const minTime = new Date(departureTime);
  minTime.setHours(minTime.getHours() - 24);
  const maxTime = new Date(departureTime);
  maxTime.setHours(maxTime.getHours() + 24);

  // Check driver conflicts
  const driverTrips = await prisma.trip.findMany({
    where: {
      companyId,
      driverId,
      departureTime: {
        gte: minTime,
        lte: maxTime,
      },
    },
    select: {
      departureTime: true,
      origin: true,
      destination: true,
    },
  });

  if (driverTrips.length > 0) {
    const trip = driverTrips[0];
    conflicts.push(
      `Driver already assigned to trip on ${trip.departureTime.toISOString().split('T')[0]} ${trip.departureTime.toISOString().split('T')[1].slice(0, 5)} (${trip.origin} → ${trip.destination}). Must be at least 24 hours apart. Change the driver or adjust the departure time`
    );
  }

  // Check conductor conflicts
  const conductorTrips = await prisma.trip.findMany({
    where: {
      companyId,
      conductorId,
      departureTime: {
        gte: minTime,
        lte: maxTime,
      },
    },
    select: {
      departureTime: true,
      origin: true,
      destination: true,
    },
  });

  if (conductorTrips.length > 0) {
    const trip = conductorTrips[0];
    conflicts.push(
      `Conductor already assigned to trip on ${trip.departureTime.toISOString().split('T')[0]} ${trip.departureTime.toISOString().split('T')[1].slice(0, 5)} (${trip.origin} → ${trip.destination}). Must be at least 24 hours apart. Change the conductor or adjust the departure time`
    );
  }

  // Check vehicle conflicts
  const vehicleTrips = await prisma.trip.findMany({
    where: {
      companyId,
      vehicleId,
      departureTime: {
        gte: minTime,
        lte: maxTime,
      },
    },
    select: {
      departureTime: true,
    },
  });

  if (vehicleTrips.length > 0) {
    const trip = vehicleTrips[0];
    conflicts.push(
      `Vehicle already in use on ${trip.departureTime.toISOString().split('T')[0]} ${trip.departureTime.toISOString().split('T')[1].slice(0, 5)}. Assign a different vehicle or change the departure time`
    );
  }

  // Check manual ticketer conflicts (if provided)
  if (manualTicketerId) {
    const ticketerTrips = await prisma.trip.findMany({
      where: {
        companyId,
        manualTicketerId,
        departureTime: {
          gte: minTime,
          lte: maxTime,
        },
      },
      select: {
        departureTime: true,
      },
    });

    if (ticketerTrips.length > 0) {
      const trip = ticketerTrips[0];
      conflicts.push(
        `Manual ticketer already assigned to trip on ${trip.departureTime.toISOString().split('T')[0]} ${trip.departureTime.toISOString().split('T')[1].slice(0, 5)}. Must be at least 24 hours apart`
      );
    }
  }

  return conflicts;
}

/**
 * Create a single trip with all related data
 */
async function createTrip(
  trip: MappedTrip,
  companyId: string,
  adminId: string
) {
  const departureTime = createDateTime(trip.departureDate, trip.departureTime);

  // Create trip with intermediate stops (if provided)
  const intermediateStops = trip.intermediateStops?.join(',') || '';

  // Apply auto-halt rule: trips with ≤10 total slots start halted
  const shouldAutoHalt = trip.totalSlots <= 10;

  const createdTrip = await prisma.trip.create({
    data: {
      origin: trip.origin,
      destination: trip.destination,
      departureTime,
      estimatedDuration: trip.estimatedDuration,
      distance: trip.distance,
      price: trip.price,
      busType: trip.busType,
      totalSlots: trip.totalSlots,
      availableSlots: trip.totalSlots,
      intermediateStops,
      hasWater: trip.hasWater || false,
      hasFood: trip.hasFood || false,
      driverId: trip.driverId,
      conductorId: trip.conductorId,
      manualTicketerId: trip.manualTicketerId,
      vehicleId: trip.vehicleId,
      companyId,
      status: 'SCHEDULED',
      bookingHalted: shouldAutoHalt,
    },
  });

  // Create audit log
  await prisma.adminLog.create({
    data: {
      action: 'TRIP_CREATED_VIA_IMPORT',
      details: `Trip ${createdTrip.id} created via CSV/Excel import: ${trip.origin} → ${trip.destination} on ${trip.departureDate} ${trip.departureTime}. Prepared by: ${trip.preparedBy}`,
      userId: adminId,
      companyId,
    },
  });

  return createdTrip;
}

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
    const customMappingsJson = formData.get('mappings') as string | null;

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
          error: `File too large (${sizeMB}MB). Maximum allowed: 5MB`,
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
      const arrayBuffer = await file.arrayBuffer();
      parseResult = await parseXLSX(arrayBuffer);
    }

    if (!parseResult.success || parseResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          errors: parseResult.errors.length > 0
            ? parseResult.errors
            : ['Cannot parse file'],
        },
        { status: 400 }
      );
    }

    // Validate row count
    if (parseResult.data.length > MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          errors: [`Maximum ${MAX_ROWS} trips per import`],
        },
        { status: 400 }
      );
    }

    // Get headers and apply column mapping if needed
    const headers = Object.keys(parseResult.data[0]);
    let mappedData = parseResult.data;

    // Check if custom mappings are provided
    if (customMappingsJson) {
      try {
        const customMappings: ColumnMapping[] = JSON.parse(customMappingsJson);
        mappedData = applyMapping(parseResult.data, customMappings);
      } catch {
        return NextResponse.json(
          { error: 'Invalid mappings format' },
          { status: 400 }
        );
      }
    } else {
      // Auto-detect columns if not an exact match
      const hasExactMatch = REQUIRED_COLUMNS.every(col => headers.includes(col));

      if (!hasExactMatch) {
        const mappingResult = autoDetectColumns(headers);
        if (mappingResult.confidence === 'complete') {
          // Auto-apply high-confidence mappings
          mappedData = applyMapping(parseResult.data, mappingResult.mappings);
        }
      }
    }

    // Validate columns (after potential mapping)
    const mappedHeaders = Object.keys(mappedData[0] || {});
    const columnErrors = validateColumns(mappedHeaders);

    if (columnErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: columnErrors },
        { status: 400 }
      );
    }

    // Validate all rows (with mapped data)
    const validationResult = validateAllRows(mappedData);

    if (validationResult.hasErrors) {
      const allErrors = validationResult.validatedRows
        .filter((r) => !r.isValid)
        .flatMap((r) => r.errors);

      return NextResponse.json(
        {
          success: false,
          errors: allErrors,
        },
        { status: 400 }
      );
    }

    // Map to database entities
    const validData = validationResult.validatedRows
      .filter((r) => r.isValid)
      .map((r) => r.data);

    const mappingResult = await mapTripsToDatabase(
      validData,
      session.user.companyId
    );

    if (!mappingResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: mappingResult.errors,
        },
        { status: 400 }
      );
    }

    // Check 24-hour conflicts for all trips
    const conflictErrors: any[] = [];

    for (let i = 0; i < mappingResult.mappedTrips.length; i++) {
      const trip = mappingResult.mappedTrips[i];
      const rowNumber = i + 2;

      const departureTime = createDateTime(trip.departureDate, trip.departureTime);

      const conflicts = await checkConflicts(
        departureTime,
        trip.driverId,
        trip.conductorId,
        trip.vehicleId,
        session.user.companyId,
        trip.manualTicketerId
      );

      if (conflicts.length > 0) {
        conflicts.forEach((conflict) => {
          conflictErrors.push({
            row: rowNumber,
            field: 'departureTime',
            message: conflict,
          });
        });
      }
    }

    if (conflictErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors: conflictErrors,
        },
        { status: 400 }
      );
    }

    // Create all trips in a transaction (atomic operation)
    const createdTrips = await prisma.$transaction(
      async (tx) => {
        const trips = [];

        for (const mappedTrip of mappingResult.mappedTrips) {
          // Create forward trip
          const trip = await createTrip(
            mappedTrip,
            session.user.companyId!,
            session.user.id
          );
          trips.push(trip);

          // Create return trip if specified
          if (mappedTrip.returnTrip) {
            const returnTrip: MappedTrip = {
              ...mappedTrip,
              // Swap origin and destination
              origin: mappedTrip.destination,
              destination: mappedTrip.origin,
              departureDate: mappedTrip.returnTrip.departureDate,
              departureTime: mappedTrip.returnTrip.departureTime,
            };

            const returnTripCreated = await createTrip(
              returnTrip,
              session.user.companyId!,
              session.user.id
            );
            trips.push(returnTripCreated);
          }
        }

        return trips;
      },
      {
        timeout: TRANSACTION_TIMEOUT,
      }
    );

    // Create summary audit log
    await prisma.adminLog.create({
      data: {
        action: 'TRIP_IMPORT_COMPLETED',
        details: `Successfully imported ${createdTrips.length} trips from ${file.name}`,
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json({
      success: true,
      tripsCreated: createdTrips.length,
      trips: createdTrips,
    });
  } catch (error) {
    console.error('Trip import error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [
          `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      },
      { status: 500 }
    );
  }
}
