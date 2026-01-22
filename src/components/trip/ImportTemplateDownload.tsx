'use client';

/**
 * Import Template Download Component
 * Generates and downloads CSV/XLSX templates with example data
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

// Example data for template (realistic Ethiopian trips)
const EXAMPLE_ROWS = [
  {
    origin: 'Addis Ababa',
    destination: 'Dire Dawa',
    departureDate: '2026-01-30',
    departureTime: '08:00',
    estimatedDuration: 540,
    distance: 515,
    price: 850,
    busType: 'standard',
    totalSlots: 45,
    driverPhone: '0911111111',
    conductorPhone: '0922222222',
    vehiclePlateNumber: '3-12345',
    preparedBy: 'John Doe',
    hasWater: 'TRUE',
    hasFood: 'FALSE',
    intermediateStops: 'Adama,Awash',
    manualTicketerPhone: '0933333333',
    returnTripDate: '2026-01-31',
    returnTripTime: '08:00',
  },
  {
    origin: 'Addis Ababa',
    destination: 'Bahir Dar',
    departureDate: '2026-02-01',
    departureTime: '06:00',
    estimatedDuration: 600,
    distance: 565,
    price: 900,
    busType: 'luxury',
    totalSlots: 40,
    driverPhone: '0914444444',
    conductorPhone: '0925555555',
    vehiclePlateNumber: 'AA-67890',
    preparedBy: 'Jane Smith',
    hasWater: 'TRUE',
    hasFood: 'TRUE',
    intermediateStops: 'Dejen',
    manualTicketerPhone: '',
    returnTripDate: '',
    returnTripTime: '',
  },
  {
    origin: 'Addis Ababa',
    destination: 'Hawassa',
    departureDate: '2026-02-03',
    departureTime: '07:30',
    estimatedDuration: 240,
    distance: 275,
    price: 500,
    busType: 'mini',
    totalSlots: 15,
    driverPhone: '0916666666',
    conductorPhone: '0927777777',
    vehiclePlateNumber: '2-54321',
    preparedBy: 'Admin',
    hasWater: 'FALSE',
    hasFood: 'FALSE',
    intermediateStops: '',
    manualTicketerPhone: '',
    returnTripDate: '2026-02-04',
    returnTripTime: '15:00',
  },
];

const HEADERS = [
  'origin',
  'destination',
  'departureDate',
  'departureTime',
  'estimatedDuration',
  'distance',
  'price',
  'busType',
  'totalSlots',
  'driverPhone',
  'conductorPhone',
  'vehiclePlateNumber',
  'preparedBy',
  'hasWater',
  'hasFood',
  'intermediateStops',
  'manualTicketerPhone',
  'returnTripDate',
  'returnTripTime',
];

export function ImportTemplateDownload() {
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [isGeneratingXLSX, setIsGeneratingXLSX] = useState(false);
  const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);

  /**
   * Download smart template with company data
   */
  const downloadSmartTemplate = async () => {
    setIsGeneratingSmart(true);

    try {
      const response = await fetch('/api/company/trips/import/template');

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate template');
        return;
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'smart-template.xlsx';

      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Smart template downloaded successfully!');
    } catch (error) {
      console.error('Smart template download error:', error);
      toast.error('Failed to download template. Please try again.');
    } finally {
      setIsGeneratingSmart(false);
    }
  };

  /**
   * Generate and download CSV template
   */
  const downloadCSV = () => {
    setIsGeneratingCSV(true);

    try {
      // Build CSV content
      const csvLines = [];

      // Add header row
      csvLines.push(HEADERS.join(','));

      // Add example rows
      EXAMPLE_ROWS.forEach((row) => {
        const values = HEADERS.map((header) => {
          const value = row[header as keyof typeof row];
          // Wrap in quotes if contains comma
          return String(value).includes(',') ? `"${value}"` : String(value);
        });
        csvLines.push(values.join(','));
      });

      const csvContent = csvLines.join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'trip-import-template.csv';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  /**
   * Generate and download XLSX template with formatting
   */
  const downloadXLSX = async () => {
    setIsGeneratingXLSX(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Trip Import');

      // Add header row with styling
      const headerRow = worksheet.addRow(HEADERS);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D9488' }, // Teal color
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Set column widths
      worksheet.columns = [
        { key: 'origin', width: 20 },
        { key: 'destination', width: 20 },
        { key: 'departureDate', width: 15 },
        { key: 'departureTime', width: 15 },
        { key: 'estimatedDuration', width: 20 },
        { key: 'distance', width: 12 },
        { key: 'price', width: 12 },
        { key: 'busType', width: 12 },
        { key: 'totalSlots', width: 12 },
        { key: 'driverPhone', width: 15 },
        { key: 'conductorPhone', width: 15 },
        { key: 'vehiclePlateNumber', width: 20 },
        { key: 'preparedBy', width: 20 },
        { key: 'hasWater', width: 12 },
        { key: 'hasFood', width: 12 },
        { key: 'intermediateStops', width: 25 },
        { key: 'manualTicketerPhone', width: 20 },
        { key: 'returnTripDate', width: 15 },
        { key: 'returnTripTime', width: 15 },
      ];

      // Add example rows
      EXAMPLE_ROWS.forEach((row) => {
        worksheet.addRow(row);
      });

      // Add data validation for busType column
      const busTypeColumn = 8; // H column (8th column)
      for (let i = 2; i <= EXAMPLE_ROWS.length + 1; i++) {
        const cell = worksheet.getCell(i, busTypeColumn);
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"standard,luxury,mini"'],
          showErrorMessage: true,
          errorTitle: 'Invalid Bus Type',
          error: 'Please select one of: standard, luxury, mini',
        };
      }

      // Add data validation for boolean columns (hasWater, hasFood)
      const booleanColumns = [14, 15]; // N and O columns
      booleanColumns.forEach((col) => {
        for (let i = 2; i <= EXAMPLE_ROWS.length + 1; i++) {
          const cell = worksheet.getCell(i, col);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"TRUE,FALSE,1,0"'],
          };
        }
      });

      // Freeze header row
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'trip-import-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingXLSX(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Download Template</h3>
        <p className="text-sm text-muted-foreground">
          Download a template file to get started. Fill in your trip details and upload the file below.
        </p>
      </div>

      {/* Smart Template - Featured */}
      <div className="border-2 border-teal-600 rounded-lg p-4 bg-teal-50 dark:bg-teal-950/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-1">
              Smart Template (Recommended)
            </h4>
            <p className="text-sm text-teal-800 dark:text-teal-200 mb-3">
              Pre-filled with YOUR company data: vehicles, drivers, conductors, cities. Auto-fills
              bus capacity and validates as you type!
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-white dark:bg-teal-900 px-2 py-1 rounded-md text-teal-800 dark:text-teal-200">
                ✓ Auto-fill dropdowns
              </span>
              <span className="text-xs bg-white dark:bg-teal-900 px-2 py-1 rounded-md text-teal-800 dark:text-teal-200">
                ✓ Smart formulas
              </span>
              <span className="text-xs bg-white dark:bg-teal-900 px-2 py-1 rounded-md text-teal-800 dark:text-teal-200">
                ✓ Real company data
              </span>
              <span className="text-xs bg-white dark:bg-teal-900 px-2 py-1 rounded-md text-teal-800 dark:text-teal-200">
                ✓ Instructions included
              </span>
            </div>
            <Button
              onClick={downloadSmartTemplate}
              disabled={isGeneratingSmart}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGeneratingSmart ? 'Generating...' : 'Download Smart Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Templates */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
          Basic Templates (Generic)
        </h4>
        <div className="flex gap-3">
          <Button
            onClick={downloadCSV}
            disabled={isGeneratingCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isGeneratingCSV ? 'Generating...' : 'CSV Template'}
          </Button>

          <Button
            onClick={downloadXLSX}
            disabled={isGeneratingXLSX}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isGeneratingXLSX ? 'Generating...' : 'Excel Template'}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <p>• CSV: Simple text format, works in any spreadsheet software</p>
          <p>• Excel: Basic formatting with dropdown menus</p>
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ You'll need to manually enter staff phones and vehicle plates
          </p>
        </div>
      </div>
    </div>
  );
}
