'use client';

/**
 * Import Preview Table Component
 * Displays validation results for imported trips
 */

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidatedRow {
  row: number;
  data: any;
  errors: ValidationError[];
  isValid: boolean;
}

interface ImportPreviewTableProps {
  validatedRows: ValidatedRow[];
  validCount: number;
  errorCount: number;
}

export function ImportPreviewTable({
  validatedRows,
  validCount,
  errorCount,
}: ImportPreviewTableProps) {
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Results</CardTitle>
          <CardDescription>
            Review all rows before importing. Fix errors and re-upload if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">
                <span className="font-semibold text-green-600">{validCount}</span> valid
              </span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm">
                  <span className="font-semibold text-red-600">{errorCount}</span> with errors
                </span>
              </div>
            )}
          </div>

          {errorCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-semibold mb-1">Cannot import with errors</p>
                  <p>
                    Please fix the errors highlighted below and re-upload the file. All rows must
                    pass validation before importing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bus Type</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead className="min-w-[300px]">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedRows.map((row) => (
                <TableRow
                  key={row.row}
                  className={
                    row.isValid
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-red-50 dark:bg-red-950/20'
                  }
                >
                  <TableCell className="font-medium">{row.row}</TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.data.origin || '-'}</TableCell>
                  <TableCell className="font-medium">{row.data.destination || '-'}</TableCell>
                  <TableCell>{row.data.departureDate || '-'}</TableCell>
                  <TableCell>{row.data.departureTime || '-'}</TableCell>
                  <TableCell>
                    {row.data.price ? `${row.data.price} ETB` : '-'}
                  </TableCell>
                  <TableCell>
                    {row.data.busType ? (
                      <Badge variant="secondary">{row.data.busType}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{row.data.totalSlots || '-'}</TableCell>
                  <TableCell>
                    {row.errors.length > 0 ? (
                      <div className="space-y-1">
                        {row.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded"
                          >
                            <span className="font-semibold">{error.field}:</span> {error.message}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-green-700 dark:text-green-300">
                        No errors
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
