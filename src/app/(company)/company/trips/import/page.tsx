'use client';

/**
 * Trip Import Page
 * Bulk import trips from CSV/Excel files with smart column mapping
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, FileUp, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ImportTemplateDownload } from '@/components/trip/ImportTemplateDownload';
import { ImportPreviewTable, ValidatedRow } from '@/components/trip/ImportPreviewTable';
import { ColumnMapper } from '@/components/import/ColumnMapper';
import { ColumnMapping, MappingResult } from '@/lib/import/column-mapping';
import { toast } from 'sonner';

type Step = 'upload' | 'validating' | 'mapping' | 'preview' | 'importing' | 'success';

interface MappingApiResult {
  mappings: ColumnMapping[];
  unmappedRequired: string[];
  confidence: 'complete' | 'partial' | 'manual';
}

export default function TripImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Column mapping state
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [sampleData, setSampleData] = useState<Record<string, string>[]>([]);
  const [confirmedMappings, setConfirmedMappings] = useState<ColumnMapping[] | null>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xlsx'].includes(fileExtension)) {
      toast.error('Invalid file type. Please upload a .csv or .xlsx file');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`File too large (${sizeMB}MB). Maximum size is 5MB`);
      return;
    }

    setSelectedFile(file);
    setConfirmedMappings(null);
    validateFile(file);
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xlsx'].includes(fileExtension)) {
      toast.error('Invalid file type. Please upload a .csv or .xlsx file');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`File too large (${sizeMB}MB). Maximum size is 5MB`);
      return;
    }

    setSelectedFile(file);
    setConfirmedMappings(null);
    validateFile(file);
  };

  /**
   * Validate uploaded file
   */
  const validateFile = async (file: File, customMappings?: ColumnMapping[]) => {
    setStep('validating');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // If we have custom mappings, include them
      if (customMappings) {
        formData.append('mappings', JSON.stringify(customMappings));
      }

      const response = await fetch('/api/company/trips/import/validate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          toast.error(data.errors[0] || 'Validation failed');
        } else {
          toast.error(data.error || 'Validation failed');
        }
        setStep('upload');
        setSelectedFile(null);
        return;
      }

      // Check if column mapping is needed
      if (data.needsMapping) {
        setMappingResult({
          mappings: data.mappingResult.mappings,
          unmappedRequired: data.mappingResult.unmappedRequired,
          autoDetected: data.mappingResult.confidence !== 'manual',
          confidence: data.mappingResult.confidence,
        });
        setSampleData(data.sampleData || []);
        setStep('mapping');

        if (data.mappingResult.confidence === 'partial') {
          toast.info('Please review the auto-detected column mappings');
        } else {
          toast.warning('Your columns need to be mapped to i-Ticket fields');
        }
        return;
      }

      if (data.success) {
        setValidatedRows(data.validatedRows || []);
        setValidCount(data.validCount || 0);
        setErrorCount(data.errorCount || 0);
        setWarnings(data.warnings || []);
        setStep('preview');

        if (data.columnMapping?.applied) {
          toast.success(`Validated ${data.validCount} trips (columns auto-mapped)`);
        } else if (data.warnings && data.warnings.length > 0) {
          toast.success(`Validated ${data.validCount} trips with ${data.warnings.length} warning(s)`);
        } else {
          toast.success(`Validated ${data.validCount} trips successfully`);
        }
      } else {
        setValidatedRows(data.validatedRows || []);
        setValidCount(data.validCount || 0);
        setErrorCount(data.errorCount || 0);
        setWarnings(data.warnings || []);
        setStep('preview');
        toast.error(`Found ${data.errorCount} errors. Please fix and re-upload`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate file. Please try again');
      setStep('upload');
      setSelectedFile(null);
    }
  };

  /**
   * Handle column mapping confirmation
   */
  const handleMappingConfirm = (mappings: ColumnMapping[]) => {
    setConfirmedMappings(mappings);
    if (selectedFile) {
      validateFile(selectedFile, mappings);
    }
  };

  /**
   * Handle column mapping cancel
   */
  const handleMappingCancel = () => {
    setStep('upload');
    setSelectedFile(null);
    setMappingResult(null);
    setSampleData([]);
  };

  /**
   * Import trips
   */
  const handleImport = async () => {
    if (!selectedFile) return;

    setStep('importing');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Include mappings if we used custom ones
      if (confirmedMappings) {
        formData.append('mappings', JSON.stringify(confirmedMappings));
      }

      const response = await fetch('/api/company/trips/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          toast.error(data.errors[0] || 'Import failed');
        } else {
          toast.error(data.error || 'Import failed');
        }
        setStep('preview');
        return;
      }

      if (data.success) {
        setImportedCount(data.tripsCreated || 0);
        setStep('success');
        toast.success(`Successfully imported ${data.tripsCreated} trips!`);

        // Redirect to trips page after 2 seconds
        setTimeout(() => {
          router.push('/company/trips?imported=true');
        }, 2000);
      } else {
        toast.error('Import failed. Please check for errors and try again');
        setStep('preview');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import trips. Please try again');
      setStep('preview');
    }
  };

  /**
   * Reset and start over
   */
  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidatedRows([]);
    setValidCount(0);
    setErrorCount(0);
    setImportedCount(0);
    setWarnings([]);
    setMappingResult(null);
    setSampleData([]);
    setConfirmedMappings(null);
  };

  /**
   * Retry with new file (keeps mappings for reference but resets validation)
   */
  const handleRetry = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidatedRows([]);
    setValidCount(0);
    setErrorCount(0);
    setWarnings([]);
    // Keep mappingResult and confirmedMappings for reference
    // Clear the file input so user can select new file
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Import Trips</h1>
        <p className="text-muted-foreground">
          Upload a CSV or Excel file to create multiple trips at once. Smart column detection
          will automatically map your columns.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'upload' || step === 'validating' ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' || step === 'validating' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            1
          </div>
          <span>Upload</span>
        </div>
        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
        <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Map Columns</span>
        </div>
        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
        <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            2
          </div>
          <span>Review</span>
        </div>
        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
        <div className={`flex items-center gap-2 ${step === 'importing' || step === 'success' ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'importing' || step === 'success' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
            3
          </div>
          <span>Import</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {(step === 'upload' || step === 'validating') && (
        <div className="space-y-6">
          <ImportTemplateDownload />

          {/* Smart Detection Feature Highlight */}
          <Alert className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <AlertTitle className="text-teal-800 dark:text-teal-300">Smart Column Detection</AlertTitle>
            <AlertDescription className="text-teal-700 dark:text-teal-400">
              You can use your own column names! Our system will automatically detect and map common
              variations like "From" → "origin", "Date" → "departureDate", etc.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Select a CSV or Excel file with your trip data (max 50 rows, 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-teal-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {step === 'validating' ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
                    <p className="text-lg font-medium">Analyzing file...</p>
                    <p className="text-sm text-muted-foreground">
                      Detecting columns in {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium mb-1">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Accepts .csv and .xlsx files up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 1.5: Column Mapping */}
      {step === 'mapping' && mappingResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Column Mapping</h2>
              <p className="text-sm text-muted-foreground">
                File: {selectedFile?.name}
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>

          <ColumnMapper
            mappingResult={mappingResult}
            sampleData={sampleData}
            onConfirm={handleMappingConfirm}
            onCancel={handleMappingCancel}
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Preview and Review</h2>
              <p className="text-sm text-muted-foreground">
                File: {selectedFile?.name}
                {confirmedMappings && (
                  <span className="ml-2 text-teal-600">(columns mapped)</span>
                )}
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>

          {/* Display Warnings (Non-Blocking) */}
          {warnings && warnings.length > 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                Warnings ({warnings.length})
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                <p className="mb-2 text-sm">
                  The following issues were detected. These are non-blocking warnings - you can still
                  proceed with the import:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <ImportPreviewTable
            validatedRows={validatedRows}
            validCount={validCount}
            errorCount={errorCount}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="border-teal-500 text-teal-600 hover:bg-teal-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry with New File
            </Button>
            <Button
              onClick={handleImport}
              disabled={errorCount > 0}
              className="bg-teal-600 hover:bg-teal-700 !text-white"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Import {validCount} Trips
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-teal-600" />
              <h2 className="text-2xl font-semibold">Importing trips...</h2>
              <p className="text-muted-foreground">
                Creating {validCount} trips in the database. Please wait...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-semibold">Import Successful!</h2>
              <p className="text-muted-foreground">
                Successfully imported {importedCount} trips
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to trips page...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
