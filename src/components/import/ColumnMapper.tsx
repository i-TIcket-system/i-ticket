'use client';

/**
 * Column Mapper Component
 * Allows users to map their Excel columns to i-Ticket fields
 */

import { useState, useEffect } from 'react';
import { Check, AlertTriangle, HelpCircle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ColumnMapping,
  MappingResult,
  REQUIRED_FIELDS,
  getFieldDescription,
  validateMappings,
} from '@/lib/import/column-mapping';

interface ColumnMapperProps {
  mappingResult: MappingResult;
  sampleData: Record<string, string>[]; // First few rows for preview
  onConfirm: (mappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

// All available i-Ticket fields for mapping
const ALL_FIELDS = [
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
  'distance',
  'intermediateStops',
  'hasWater',
  'hasFood',
  'manualTicketerPhone',
  'driverName',
  'conductorName',
  'manualTicketerName',
  'returnTripDate',
  'returnTripTime',
];

export function ColumnMapper({
  mappingResult,
  sampleData,
  onConfirm,
  onCancel,
}: ColumnMapperProps) {
  // Ensure mappings is always an array (null safety)
  const initialMappings = mappingResult?.mappings ?? [];
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [validation, setValidation] = useState(() => validateMappings(initialMappings));

  // Re-validate whenever mappings change
  useEffect(() => {
    setValidation(validateMappings(mappings));
  }, [mappings]);

  // Get fields that are already mapped
  const usedFields = new Set(
    mappings.filter(m => m.iTicketField).map(m => m.iTicketField!)
  );

  // Handle mapping change
  const handleMappingChange = (userColumn: string, newField: string | null) => {
    setMappings(prev =>
      prev.map(m =>
        m.userColumn === userColumn
          ? { ...m, iTicketField: newField, confidence: newField ? 'exact' : 'none' }
          : m
      )
    );
  };

  // Get sample values for a column
  const getSampleValues = (column: string): string[] => {
    return sampleData
      .slice(0, 3)
      .map(row => row[column] || '')
      .filter(v => v !== '');
  };

  // Get confidence badge color
  const getConfidenceBadge = (confidence: ColumnMapping['confidence']) => {
    switch (confidence) {
      case 'exact':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Exact Match</Badge>;
      case 'high':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Low</Badge>;
      default:
        return <Badge variant="outline">Not Mapped</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <CardTitle>Map Your Columns</CardTitle>
        </div>
        <CardDescription>
          {mappingResult.confidence === 'complete' ? (
            <span className="text-green-600 dark:text-green-400">
              All columns were automatically detected. Review and confirm the mappings below.
            </span>
          ) : mappingResult.confidence === 'partial' ? (
            <span className="text-yellow-600 dark:text-yellow-400">
              Most columns were detected. Please verify the mappings and fill in any missing fields.
            </span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400">
              Your column names don't match our template. Please map each column to the correct field.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Status */}
        {!validation.valid && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Missing Required Fields</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Please map the following: {validation.missingFields.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Column Mappings */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
            <div className="col-span-3">Your Column</div>
            <div className="col-span-3">Sample Values</div>
            <div className="col-span-4">Maps To</div>
            <div className="col-span-2">Confidence</div>
          </div>

          <TooltipProvider>
            {mappings.map((mapping) => {
              const isRequired = mapping.iTicketField
                ? REQUIRED_FIELDS.includes(mapping.iTicketField)
                : false;
              const sampleValues = getSampleValues(mapping.userColumn);

              return (
                <div
                  key={mapping.userColumn}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-md ${
                    mapping.iTicketField
                      ? 'bg-green-50/50 dark:bg-green-900/10'
                      : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  {/* User Column */}
                  <div className="col-span-3 font-medium truncate" title={mapping.userColumn}>
                    {mapping.userColumn}
                  </div>

                  {/* Sample Values */}
                  <div className="col-span-3 text-sm text-muted-foreground truncate">
                    {sampleValues.length > 0 ? (
                      <span title={sampleValues.join(', ')}>
                        {sampleValues.slice(0, 2).join(', ')}
                        {sampleValues.length > 2 && '...'}
                      </span>
                    ) : (
                      <span className="italic">No data</span>
                    )}
                  </div>

                  {/* Field Selector */}
                  <div className="col-span-4 flex items-center gap-2">
                    <Select
                      value={mapping.iTicketField || '__none__'}
                      onValueChange={(value) =>
                        handleMappingChange(mapping.userColumn, value === '__none__' ? null : value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">— Skip this column —</span>
                        </SelectItem>
                        {ALL_FIELDS.map((field) => {
                          const isUsed = usedFields.has(field) && field !== mapping.iTicketField;
                          const fieldRequired = REQUIRED_FIELDS.includes(field);

                          return (
                            <SelectItem
                              key={field}
                              value={field}
                              disabled={isUsed}
                              className={isUsed ? 'opacity-50' : ''}
                            >
                              <span className="flex items-center gap-2">
                                {field}
                                {fieldRequired && (
                                  <span className="text-xs text-destructive">*</span>
                                )}
                                {isUsed && (
                                  <span className="text-xs text-muted-foreground">(already used)</span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {mapping.iTicketField && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getFieldDescription(mapping.iTicketField)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Confidence Badge */}
                  <div className="col-span-2 flex items-center gap-1">
                    {getConfidenceBadge(mapping.confidence)}
                    {isRequired && mapping.iTicketField && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-4">
          <span className="flex items-center gap-1">
            <span className="text-destructive">*</span> Required field
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-600" /> Mapped & required
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(mappings)}
            disabled={!validation.valid}
            className="bg-teal-600 hover:bg-teal-700 !text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Mappings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
