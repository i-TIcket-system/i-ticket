/**
 * Smart Trip Import Template API
 * Generates Excel template with company-specific data for easy trip import
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
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
        { error: 'Only company admins can download templates' },
        { status: 403 }
      );
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Company ID not found' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;

    // Fetch company data in parallel
    const [company, cities, vehicles, drivers, conductors, ticketers] = await Promise.all([
      // Company info
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      }),

      // All active cities
      prisma.city.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { name: 'asc' },
      }),

      // Company vehicles
      prisma.vehicle.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: {
          plateNumber: true,
          totalSeats: true,
          busType: true,
        },
        orderBy: { plateNumber: 'asc' },
      }),

      // Drivers
      prisma.user.findMany({
        where: {
          companyId,
          role: 'COMPANY_ADMIN',
          staffRole: 'DRIVER',
        },
        select: {
          phone: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      // Conductors
      prisma.user.findMany({
        where: {
          companyId,
          role: 'COMPANY_ADMIN',
          staffRole: 'CONDUCTOR',
        },
        select: {
          phone: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      // Manual Ticketers
      prisma.user.findMany({
        where: {
          companyId,
          role: 'COMPANY_ADMIN',
          staffRole: 'MANUAL_TICKETER',
        },
        select: {
          phone: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'i-Ticket Platform';
    workbook.created = new Date();

    // ============================================
    // SHEET 1: Trip Data (Main Input Sheet)
    // ============================================
    const tripSheet = workbook.addWorksheet('Trip Data', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Define columns
    tripSheet.columns = [
      { header: 'origin', key: 'origin', width: 20 },
      { header: 'destination', key: 'destination', width: 20 },
      { header: 'departureDate', key: 'departureDate', width: 15 },
      { header: 'departureTime', key: 'departureTime', width: 15 },
      { header: 'estimatedDuration', key: 'estimatedDuration', width: 20 },
      { header: 'distance', key: 'distance', width: 12 },
      { header: 'price', key: 'price', width: 12 },
      { header: 'busType', key: 'busType', width: 15 },
      { header: 'totalSlots', key: 'totalSlots', width: 12 },
      { header: 'driverPhone', key: 'driverPhone', width: 20 },
      { header: 'driverName', key: 'driverName', width: 25 }, // NEW - Auto-filled
      { header: 'conductorPhone', key: 'conductorPhone', width: 20 },
      { header: 'conductorName', key: 'conductorName', width: 25 }, // NEW - Auto-filled
      { header: 'vehiclePlateNumber', key: 'vehiclePlateNumber', width: 20 },
      { header: 'preparedBy', key: 'preparedBy', width: 20 },
      { header: 'hasWater', key: 'hasWater', width: 12 },
      { header: 'hasFood', key: 'hasFood', width: 12 },
      { header: 'intermediateStops', key: 'intermediateStops', width: 25 },
      { header: 'manualTicketerPhone', key: 'manualTicketerPhone', width: 20 },
      { header: 'manualTicketerName', key: 'manualTicketerName', width: 25 }, // NEW - Auto-filled
      { header: 'returnTripDate', key: 'returnTripDate', width: 15 },
      { header: 'returnTripTime', key: 'returnTripTime', width: 15 },
    ];

    // Style header row
    const headerRow = tripSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add 3 example rows with formulas
    const today = new Date();
    const futureDate1 = new Date(today);
    futureDate1.setDate(today.getDate() + 7);
    const futureDate2 = new Date(today);
    futureDate2.setDate(today.getDate() + 9);
    const futureDate3 = new Date(today);
    futureDate3.setDate(today.getDate() + 11);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Example row 1
    tripSheet.addRow({
      origin: cities[0]?.name || 'Addis Ababa',
      destination: cities[1]?.name || 'Dire Dawa',
      departureDate: formatDate(futureDate1),
      departureTime: '08:00',
      estimatedDuration: 540,
      distance: 515,
      price: 850,
      busType: '', // Will be auto-filled by formula
      totalSlots: '', // Will be auto-filled by formula
      driverPhone: drivers[0]?.phone || '',
      conductorPhone: conductors[0]?.phone || '',
      vehiclePlateNumber: vehicles[0]?.plateNumber || '',
      preparedBy: session.user.name || 'Admin',
      hasWater: 'TRUE',
      hasFood: 'FALSE',
      intermediateStops: '',
      manualTicketerPhone: '',
      returnTripDate: '',
      returnTripTime: '',
    });

    // Example row 2
    tripSheet.addRow({
      origin: cities[0]?.name || 'Addis Ababa',
      destination: cities[2]?.name || 'Bahir Dar',
      departureDate: formatDate(futureDate2),
      departureTime: '06:00',
      estimatedDuration: 600,
      distance: 565,
      price: 900,
      busType: '',
      totalSlots: '',
      driverPhone: drivers[0]?.phone || '',
      conductorPhone: conductors[0]?.phone || '',
      vehiclePlateNumber: vehicles[0]?.plateNumber || '',
      preparedBy: session.user.name || 'Admin',
      hasWater: 'TRUE',
      hasFood: 'TRUE',
      intermediateStops: '',
      manualTicketerPhone: '',
      returnTripDate: '',
      returnTripTime: '',
    });

    // Example row 3
    tripSheet.addRow({
      origin: cities[0]?.name || 'Addis Ababa',
      destination: cities[3]?.name || 'Hawassa',
      departureDate: formatDate(futureDate3),
      departureTime: '07:30',
      estimatedDuration: 240,
      distance: 275,
      price: 500,
      busType: '',
      totalSlots: '',
      driverPhone: drivers[0]?.phone || '',
      conductorPhone: conductors[0]?.phone || '',
      vehiclePlateNumber: vehicles[0]?.plateNumber || '',
      preparedBy: session.user.name || 'Admin',
      hasWater: 'FALSE',
      hasFood: 'FALSE',
      intermediateStops: '',
      manualTicketerPhone: '',
      returnTripDate: '',
      returnTripTime: '',
    });

    // ============================================
    // SHEET 2: Cities (Hidden Lookup)
    // ============================================
    const citiesSheet = workbook.addWorksheet('Cities', {
      state: 'hidden',
    });
    citiesSheet.addRow(['City Name']);
    cities.forEach((city) => {
      citiesSheet.addRow([city.name]);
    });

    // ============================================
    // SHEET 3: Vehicles (Hidden Lookup)
    // ============================================
    const vehiclesSheet = workbook.addWorksheet('Vehicles', {
      state: 'hidden',
    });
    vehiclesSheet.addRow(['Plate Number', 'Total Seats', 'Bus Type']);
    vehicles.forEach((vehicle) => {
      vehiclesSheet.addRow([vehicle.plateNumber, vehicle.totalSeats, vehicle.busType]);
    });

    // ============================================
    // SHEET 4: Drivers (Hidden Lookup)
    // ============================================
    const driversSheet = workbook.addWorksheet('Drivers', {
      state: 'hidden',
    });
    driversSheet.addRow(['Phone', 'Name']);
    drivers.forEach((driver) => {
      driversSheet.addRow([driver.phone, driver.name || 'Unknown']);
    });

    // ============================================
    // SHEET 5: Conductors (Hidden Lookup)
    // ============================================
    const conductorsSheet = workbook.addWorksheet('Conductors', {
      state: 'hidden',
    });
    conductorsSheet.addRow(['Phone', 'Name']);
    conductors.forEach((conductor) => {
      conductorsSheet.addRow([conductor.phone, conductor.name || 'Unknown']);
    });

    // ============================================
    // SHEET 6: Manual Ticketers (Hidden Lookup)
    // ============================================
    const ticketersSheet = workbook.addWorksheet('ManualTicketers', {
      state: 'hidden',
    });
    ticketersSheet.addRow(['Phone', 'Name']);
    ticketers.forEach((ticketer) => {
      ticketersSheet.addRow([ticketer.phone, ticketer.name || 'Unknown']);
    });

    // ============================================
    // Add Data Validations to Trip Data Sheet
    // ============================================

    // Add 47 more empty rows for user input (total 50 rows)
    for (let i = 0; i < 47; i++) {
      tripSheet.addRow({});
    }

    // Origin dropdown (A2:A50)
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`A${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`Cities!$A$2:$A$${cities.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Invalid City',
        error: 'Please select a city from the dropdown',
      };
    }

    // Destination dropdown (B2:B50)
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`B${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`Cities!$A$2:$A$${cities.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Invalid City',
        error: 'Please select a city from the dropdown',
      };
    }

    // Bus Type dropdown (H2:H50)
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`H${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"standard,luxury,mini"'],
      };
    }

    // Driver Phone dropdown (J2:J50)
    if (drivers.length > 0) {
      for (let row = 2; row <= 50; row++) {
        tripSheet.getCell(`J${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`Drivers!$A$2:$A$${drivers.length + 1}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Driver',
          error: 'Please select a driver from the dropdown',
        };
      }
    }

    // Conductor Phone dropdown (L2:L50) - Updated from K
    if (conductors.length > 0) {
      for (let row = 2; row <= 50; row++) {
        tripSheet.getCell(`L${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`Conductors!$A$2:$A$${conductors.length + 1}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Conductor',
          error: 'Please select a conductor from the dropdown',
        };
      }
    }

    // Vehicle Plate dropdown (N2:N50) - Updated from L
    if (vehicles.length > 0) {
      for (let row = 2; row <= 50; row++) {
        tripSheet.getCell(`N${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`Vehicles!$A$2:$A$${vehicles.length + 1}`],
          showErrorMessage: true,
          errorTitle: 'Invalid Vehicle',
          error: 'Please select a vehicle from the dropdown',
        };
      }
    }

    // Manual Ticketer Phone dropdown (S2:S50) - Updated from Q
    if (ticketers.length > 0) {
      for (let row = 2; row <= 50; row++) {
        tripSheet.getCell(`S${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`ManualTicketers!$A$2:$A$${ticketers.length + 1}`],
        };
      }
    }

    // Boolean dropdowns (P2:Q50) - Updated from N2:O50
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`P${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
      tripSheet.getCell(`Q${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TRUE,FALSE"'],
      };
    }

    // ============================================
    // Add Auto-Fill Formulas
    // ============================================

    // Total Slots (I2:I50) - Auto-fill from vehicle
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`I${row}`).value = {
        formula: `IFERROR(VLOOKUP(N${row},Vehicles!A:B,2,FALSE),"")`,
      };
    }

    // Bus Type (H2:H50) - Auto-fill from vehicle
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`H${row}`).value = {
        formula: `IFERROR(VLOOKUP(N${row},Vehicles!A:C,3,FALSE),"")`,
      };
    }

    // Driver Name (K2:K50) - Auto-fill from Drivers sheet
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`K${row}`).value = {
        formula: `IFERROR(VLOOKUP(J${row},Drivers!A:B,2,FALSE),"")`,
      };
    }

    // Conductor Name (M2:M50) - Auto-fill from Conductors sheet
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`M${row}`).value = {
        formula: `IFERROR(VLOOKUP(L${row},Conductors!A:B,2,FALSE),"")`,
      };
    }

    // Manual Ticketer Name (T2:T50) - Auto-fill from ManualTicketers sheet
    for (let row = 2; row <= 50; row++) {
      tripSheet.getCell(`T${row}`).value = {
        formula: `IFERROR(VLOOKUP(S${row},ManualTicketers!A:B,2,FALSE),"")`,
      };
    }

    // ============================================
    // SHEET 7: Instructions
    // ============================================
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.getColumn(1).width = 100;

    instructionsSheet.addRow(['📋 Smart Trip Import Template - User Guide']).font = {
      bold: true,
      size: 16,
      color: { argb: 'FF0D9488' },
    };
    instructionsSheet.addRow([]);
    instructionsSheet.addRow([`Welcome ${session.user.name || 'Admin'}! This template is customized for ${company.name}.`]);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['✨ SMART FEATURES:']).font = { bold: true, size: 12 };
    instructionsSheet.addRow(['• All dropdowns are populated with YOUR company data (updated in real-time)']);
    instructionsSheet.addRow(['• Total Slots auto-fills when you select a vehicle']);
    instructionsSheet.addRow(['• Bus Type auto-fills when you select a vehicle']);
    instructionsSheet.addRow(['• Driver/Conductor/Ticketer Names auto-fill when you select phone numbers']);
    instructionsSheet.addRow(['• Origin/Destination show all active Ethiopian cities']);
    instructionsSheet.addRow(['• Staff dropdowns show only YOUR drivers, conductors, and ticketers']);
    instructionsSheet.addRow(['• Names are informational only - phone numbers are used for lookup']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['📝 HOW TO USE:']).font = { bold: true, size: 12 };
    instructionsSheet.addRow(['1. Go to "Trip Data" sheet']);
    instructionsSheet.addRow(['2. DELETE the 3 example rows (or keep for reference)']);
    instructionsSheet.addRow(['3. Fill in your trip details using the DROPDOWNS (click cells to see options)']);
    instructionsSheet.addRow(['4. Total Slots and Bus Type will AUTO-FILL based on selected vehicle']);
    instructionsSheet.addRow(['5. Save the file']);
    instructionsSheet.addRow(['6. Upload via Company Portal → Import Trips']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['⚠️ IMPORTANT RULES:']).font = { bold: true, size: 12 };
    instructionsSheet.addRow(['• Departure dates must be in the FUTURE']);
    instructionsSheet.addRow(['• Same driver/conductor/vehicle cannot be used within 24 hours']);
    instructionsSheet.addRow(['• Origin and Destination must be DIFFERENT']);
    instructionsSheet.addRow(['• Max 50 trips per file']);
    instructionsSheet.addRow(['• All required fields must be filled']);
    instructionsSheet.addRow(['• If a name doesn\'t match the phone number, you\'ll get a warning (not an error)']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['🔄 NEED UPDATED DATA?']).font = { bold: true, size: 12 };
    instructionsSheet.addRow(['If you added new vehicles, drivers, or cities:']);
    instructionsSheet.addRow(['→ Download a fresh template to get the latest data']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['📞 SUPPORT:']).font = { bold: true, size: 12 };
    instructionsSheet.addRow(['Contact i-Ticket Support via Company Portal → Contact i-Ticket']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow([`Generated on: ${new Date().toLocaleString()}`]).font = {
      italic: true,
      size: 10,
      color: { argb: 'FF666666' },
    };

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="i-Ticket-Trip-Import-Template-${company.name.replace(/\s+/g, '-')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      {
        error: `Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
