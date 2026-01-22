/**
 * Trip Import Mapper
 * Maps CSV data to database entities and checks for conflicts
 */

import { PrismaClient } from '@prisma/client';
import { TripImportData, ValidationError } from './trip-import-validator';

const prisma = new PrismaClient();

export interface MappedTrip {
  // Trip data for batch API
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  estimatedDuration: number;
  distance?: number;
  price: number;
  busType: 'standard' | 'luxury' | 'mini';
  totalSlots: number;
  intermediateStops?: string[];
  hasWater?: boolean;
  hasFood?: boolean;
  driverId: string;
  conductorId: string;
  manualTicketerId?: string;
  vehicleId: string;
  preparedBy: string;

  // Return trip data (if applicable)
  returnTrip?: {
    departureDate: string;
    departureTime: string;
  };
}

export interface MappingResult {
  success: boolean;
  mappedTrips: MappedTrip[];
  errors: ValidationError[];
}

export interface StaffMap {
  [phone: string]: {
    id: string;
    role: string;
    staffRole: string | null;
    name: string | null;
  };
}

export interface VehicleMap {
  [plateNumber: string]: {
    id: string;
    totalSeats: number;
    status: string;
  };
}

/**
 * Batch fetch all staff by phone numbers
 */
async function fetchStaffByPhones(
  phones: string[],
  companyId: string
): Promise<StaffMap> {
  const uniquePhones = Array.from(new Set(phones));

  const staff = await prisma.user.findMany({
    where: {
      phone: { in: uniquePhones },
      companyId,
    },
    select: {
      id: true,
      phone: true,
      role: true,
      staffRole: true,
      name: true,
    },
  });

  const staffMap: StaffMap = {};
  staff.forEach((s) => {
    staffMap[s.phone] = {
      id: s.id,
      role: s.role,
      staffRole: s.staffRole,
      name: s.name,
    };
  });

  return staffMap;
}

/**
 * Batch fetch all vehicles by plate numbers
 */
async function fetchVehiclesByPlates(
  plateNumbers: string[],
  companyId: string
): Promise<VehicleMap> {
  const uniquePlates = Array.from(new Set(plateNumbers));

  const vehicles = await prisma.vehicle.findMany({
    where: {
      plateNumber: { in: uniquePlates },
      companyId,
    },
    select: {
      id: true,
      plateNumber: true,
      totalSeats: true,
      status: true,
    },
  });

  const vehicleMap: VehicleMap = {};
  vehicles.forEach((v) => {
    vehicleMap[v.plateNumber] = {
      id: v.id,
      totalSeats: v.totalSeats,
      status: v.status,
    };
  });

  return vehicleMap;
}

/**
 * Check if city exists, create if it doesn't
 * Returns city name (normalized)
 */
async function ensureCityExists(cityName: string): Promise<string> {
  const normalizedName = cityName.trim();

  // Check if city exists (case-insensitive)
  const existingCity = await prisma.city.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  if (existingCity) {
    return existingCity.name; // Return the canonical name from DB
  }

  // Create new city
  const newCity = await prisma.city.create({
    data: {
      name: normalizedName,
      isActive: true,
    },
  });

  return newCity.name;
}

/**
 * Map validated rows to database entities
 * Performs batch lookups and validation
 */
export async function mapTripsToDatabase(
  validatedData: TripImportData[],
  companyId: string
): Promise<MappingResult> {
  const errors: ValidationError[] = [];
  const mappedTrips: MappedTrip[] = [];

  try {
    // Extract all unique phone numbers and plate numbers
    const allPhones = new Set<string>();
    const allPlates = new Set<string>();

    validatedData.forEach((trip, index) => {
      allPhones.add(trip.driverPhone);
      allPhones.add(trip.conductorPhone);
      if (trip.manualTicketerPhone) {
        allPhones.add(trip.manualTicketerPhone);
      }
      allPlates.add(trip.vehiclePlateNumber);
    });

    // Batch fetch staff and vehicles
    const [staffMap, vehicleMap] = await Promise.all([
      fetchStaffByPhones(Array.from(allPhones), companyId),
      fetchVehiclesByPlates(Array.from(allPlates), companyId),
    ]);

    // Process each trip
    for (let i = 0; i < validatedData.length; i++) {
      const trip = validatedData[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and Excel is 1-indexed

      // Validate and map driver
      const driver = staffMap[trip.driverPhone];
      if (!driver) {
        errors.push({
          row: rowNumber,
          field: 'driverPhone',
          message: `Driver with phone ${trip.driverPhone} not found in your staff. Verify phone number or add driver to staff first`,
        });
        continue;
      }
      if (driver.staffRole !== 'DRIVER') {
        errors.push({
          row: rowNumber,
          field: 'driverPhone',
          message: `Staff ${trip.driverPhone} exists but role is ${driver.staffRole || 'ADMIN'}, not DRIVER. Assign a driver or update staff role`,
        });
        continue;
      }

      // Validate and map conductor
      const conductor = staffMap[trip.conductorPhone];
      if (!conductor) {
        errors.push({
          row: rowNumber,
          field: 'conductorPhone',
          message: `Conductor with phone ${trip.conductorPhone} not found in your staff. Verify phone number or add conductor to staff first`,
        });
        continue;
      }
      if (conductor.staffRole !== 'CONDUCTOR') {
        errors.push({
          row: rowNumber,
          field: 'conductorPhone',
          message: `Staff ${trip.conductorPhone} exists but role is ${conductor.staffRole || 'ADMIN'}, not CONDUCTOR. Assign a conductor or update staff role`,
        });
        continue;
      }

      // Validate and map manual ticketer (optional)
      let manualTicketerId: string | undefined;
      if (trip.manualTicketerPhone) {
        const ticketer = staffMap[trip.manualTicketerPhone];
        if (!ticketer) {
          errors.push({
            row: rowNumber,
            field: 'manualTicketerPhone',
            message: `Manual ticketer with phone ${trip.manualTicketerPhone} not found in your staff. Verify phone number or add ticketer to staff first`,
          });
          continue;
        }
        if (ticketer.staffRole !== 'MANUAL_TICKETER') {
          errors.push({
            row: rowNumber,
            field: 'manualTicketerPhone',
            message: `Staff ${trip.manualTicketerPhone} exists but role is ${ticketer.staffRole || 'ADMIN'}, not MANUAL_TICKETER. Assign a manual ticketer or update staff role`,
          });
          continue;
        }
        manualTicketerId = ticketer.id;
      }

      // Validate and map vehicle
      const vehicle = vehicleMap[trip.vehiclePlateNumber];
      if (!vehicle) {
        errors.push({
          row: rowNumber,
          field: 'vehiclePlateNumber',
          message: `Vehicle with plate ${trip.vehiclePlateNumber} not found in your fleet. Check spelling or add vehicle to fleet first`,
        });
        continue;
      }
      if (vehicle.status !== 'ACTIVE') {
        errors.push({
          row: rowNumber,
          field: 'vehiclePlateNumber',
          message: `Vehicle ${trip.vehiclePlateNumber} is ${vehicle.status}, not ACTIVE. Only active vehicles can be assigned to trips`,
        });
        continue;
      }

      // Validate totalSlots doesn't exceed vehicle capacity
      if (trip.totalSlots > vehicle.totalSeats) {
        errors.push({
          row: rowNumber,
          field: 'totalSlots',
          message: `Cannot set ${trip.totalSlots} seats. Vehicle ${trip.vehiclePlateNumber} has only ${vehicle.totalSeats} seats. Reduce to ${vehicle.totalSeats} or less, or use a larger vehicle`,
        });
        continue;
      }

      // Ensure cities exist (create if needed)
      const [originCity, destinationCity] = await Promise.all([
        ensureCityExists(trip.origin),
        ensureCityExists(trip.destination),
      ]);

      // Ensure intermediate stop cities exist
      let intermediateStops = trip.intermediateStops;
      if (intermediateStops && intermediateStops.length > 0) {
        intermediateStops = await Promise.all(
          intermediateStops.map((stop) => ensureCityExists(stop))
        );
      }

      // Build mapped trip
      const mappedTrip: MappedTrip = {
        origin: originCity,
        destination: destinationCity,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        estimatedDuration: trip.estimatedDuration,
        price: trip.price,
        busType: trip.busType,
        totalSlots: trip.totalSlots,
        driverId: driver.id,
        conductorId: conductor.id,
        vehicleId: vehicle.id,
        preparedBy: trip.preparedBy,
      };

      // Add optional fields
      if (trip.distance !== undefined) {
        mappedTrip.distance = trip.distance;
      }
      if (intermediateStops && intermediateStops.length > 0) {
        mappedTrip.intermediateStops = intermediateStops;
      }
      if (trip.hasWater !== undefined) {
        mappedTrip.hasWater = trip.hasWater;
      }
      if (trip.hasFood !== undefined) {
        mappedTrip.hasFood = trip.hasFood;
      }
      if (manualTicketerId) {
        mappedTrip.manualTicketerId = manualTicketerId;
      }

      // Add return trip data if provided
      if (trip.returnTripDate && trip.returnTripTime) {
        mappedTrip.returnTrip = {
          departureDate: trip.returnTripDate,
          departureTime: trip.returnTripTime,
        };
      }

      mappedTrips.push(mappedTrip);
    }

    return {
      success: errors.length === 0,
      mappedTrips,
      errors,
    };
  } catch (error) {
    errors.push({
      row: 0,
      field: 'general',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return {
      success: false,
      mappedTrips: [],
      errors,
    };
  }
}
