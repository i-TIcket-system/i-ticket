/**
 * CSV Parser Utility
 * Uses Papa Parse to parse CSV files with proper error handling
 */

import Papa from 'papaparse';

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedRow[];
  errors: string[];
}

/**
 * Parse CSV file content
 * @param fileContent - Raw CSV file content as string
 * @returns ParseResult with data or errors
 */
export function parseCSV(fileContent: string): ParseResult {
  const errors: string[] = [];

  try {
    const result = Papa.parse(fileContent, {
      header: true, // First row is headers
      skipEmptyLines: true, // Ignore empty rows
      transformHeader: (header) => header.trim(), // Trim whitespace from headers
      transform: (value) => value.trim(), // Trim whitespace from values
    });

    // Check for parse errors
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((error) => {
        errors.push(`Row ${error.row}: ${error.message}`);
      });
    }

    // Validate that we have data
    if (!result.data || result.data.length === 0) {
      errors.push('No data rows found. Add at least one trip row');
      return { success: false, data: [], errors };
    }

    // Papa Parse returns unknown[], we need to cast to ParsedRow[]
    const data = result.data as ParsedRow[];

    // Filter out completely empty rows (all values are empty strings)
    const nonEmptyData = data.filter((row) => {
      return Object.values(row).some((value) => value !== '');
    });

    if (nonEmptyData.length === 0) {
      errors.push('No valid data rows found after filtering empty rows');
      return { success: false, data: [], errors };
    }

    return {
      success: errors.length === 0,
      data: nonEmptyData,
      errors,
    };
  } catch (error) {
    errors.push(
      `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false, data: [], errors };
  }
}

/**
 * Parse CSV file from File object
 * @param file - File object from file input
 * @returns Promise<ParseResult>
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(parseCSV(content));
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Failed to read file. Please try again.'],
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Extract headers from CSV content
 * @param fileContent - Raw CSV file content as string
 * @returns Array of header names
 */
export function extractHeaders(fileContent: string): string[] {
  const result = Papa.parse(fileContent, {
    preview: 1, // Only parse first row
    transformHeader: (header) => header.trim(),
  });

  if (result.meta && result.meta.fields) {
    return result.meta.fields;
  }

  return [];
}

/**
 * Parse result with headers included
 */
export interface ParseResultWithHeaders extends ParseResult {
  headers: string[];
}

/**
 * Parse CSV file with headers extraction
 * @param fileContent - Raw CSV file content as string
 * @returns ParseResultWithHeaders
 */
export function parseCSVWithHeaders(fileContent: string): ParseResultWithHeaders {
  const headers = extractHeaders(fileContent);
  const parseResult = parseCSV(fileContent);

  return {
    ...parseResult,
    headers,
  };
}
