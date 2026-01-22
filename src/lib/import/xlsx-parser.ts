/**
 * XLSX Parser Utility
 * Uses exceljs to parse Excel files (.xlsx)
 */

import ExcelJS from 'exceljs';

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedRow[];
  errors: string[];
}

/**
 * Parse XLSX file from buffer
 * @param buffer - File buffer from uploaded file
 * @returns Promise<ParseResult>
 */
export async function parseXLSX(buffer: ArrayBuffer): Promise<ParseResult> {
  const errors: string[] = [];

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first worksheet
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      errors.push('No worksheets found in Excel file');
      return { success: false, data: [], errors };
    }

    if (workbook.worksheets.length > 1) {
      // Info message (not an error, just informational)
      console.log('Reading first sheet only. Other sheets will be ignored.');
    }

    // Get header row (first row)
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    headerRow.eachCell((cell, colNumber) => {
      const headerValue = cell.value?.toString().trim() || '';
      headers[colNumber - 1] = headerValue; // Excel columns are 1-indexed
    });

    if (headers.length === 0 || headers.every((h) => !h)) {
      errors.push('No column headers found in first row');
      return { success: false, data: [], errors };
    }

    // Parse data rows (starting from row 2)
    const data: ParsedRow[] = [];
    const rowCount = worksheet.rowCount;

    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData: ParsedRow = {};
      let hasData = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Convert cell value to string
          let value = '';

          if (cell.value !== null && cell.value !== undefined) {
            // Handle different cell types
            if (cell.type === ExcelJS.ValueType.Date) {
              // Format date as YYYY-MM-DD
              const date = cell.value as Date;
              value = date.toISOString().split('T')[0];
            } else if (cell.type === ExcelJS.ValueType.Boolean) {
              // Convert boolean to string
              value = cell.value ? 'TRUE' : 'FALSE';
            } else if (typeof cell.value === 'object' && 'text' in cell.value) {
              // Handle rich text
              value = cell.value.text || '';
            } else {
              value = cell.value.toString().trim();
            }

            if (value !== '') {
              hasData = true;
            }
          }

          rowData[header] = value;
        }
      });

      // Only add row if it has at least one non-empty cell
      if (hasData) {
        data.push(rowData);
      }
    }

    if (data.length === 0) {
      errors.push('No data rows found. Add at least one trip row');
      return { success: false, data: [], errors };
    }

    return {
      success: true,
      data,
      errors,
    };
  } catch (error) {
    errors.push(
      `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false, data: [], errors };
  }
}

/**
 * Parse XLSX file from File object
 * @param file - File object from file input
 * @returns Promise<ParseResult>
 */
export async function parseXLSXFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await parseXLSX(arrayBuffer);
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [
        `Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}
