/**
 * Test script for column mapping functionality
 */

import { autoDetectColumns, applyMapping, REQUIRED_FIELDS } from '../src/lib/import/column-mapping';

console.log('========================================');
console.log('SMART COLUMN MAPPING - TEST SUITE');
console.log('========================================\n');

// Test 1: Exact match columns (should work perfectly)
console.log('=== TEST 1: Exact Match Columns ===');
const exactHeaders = ['origin', 'destination', 'departureDate', 'departureTime', 'estimatedDuration', 'price', 'busType', 'totalSlots', 'driverPhone', 'conductorPhone', 'vehiclePlateNumber', 'preparedBy'];
const result1 = autoDetectColumns(exactHeaders);
console.log('Confidence:', result1.confidence);
console.log('Unmapped Required:', result1.unmappedRequired);
console.log('All mapped:', result1.unmappedRequired.length === 0 ? '✓ YES' : '✗ NO');
console.log();

// Test 2: Common variations
console.log('=== TEST 2: Common Variations ===');
const variationHeaders = ['From', 'To', 'Date', 'Time', 'Duration', 'Fare', 'Bus Type', 'Seats', 'Driver Phone', 'Conductor Phone', 'Plate Number', 'Prepared By'];
const result2 = autoDetectColumns(variationHeaders);
console.log('Confidence:', result2.confidence);
console.log('Unmapped Required:', result2.unmappedRequired);
console.log('Mappings:');
result2.mappings.forEach(m => console.log(`  ${m.userColumn} -> ${m.iTicketField} (${m.confidence})`));
console.log();

// Test 3: Mixed case and spaces
console.log('=== TEST 3: Mixed Case & Spaces ===');
const mixedHeaders = ['ORIGIN', 'Destination City', 'Travel Date', 'Departure Time', 'Trip Duration', 'Ticket Price', 'bustype', 'Total Seats', 'driver phone', 'CONDUCTOR PHONE', 'Vehicle Plate', 'Created By'];
const result3 = autoDetectColumns(mixedHeaders);
console.log('Confidence:', result3.confidence);
console.log('Unmapped Required:', result3.unmappedRequired);
console.log('Mappings:');
result3.mappings.forEach(m => console.log(`  ${m.userColumn} -> ${m.iTicketField} (${m.confidence})`));
console.log();

// Test 4: Completely different names (should need manual mapping)
console.log('=== TEST 4: Unrecognized Names ===');
const unknownHeaders = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7', 'col8', 'col9', 'col10', 'col11', 'col12'];
const result4 = autoDetectColumns(unknownHeaders);
console.log('Confidence:', result4.confidence);
console.log('Unmapped Required:', result4.unmappedRequired.length, 'fields');
console.log('Needs Manual Mapping:', result4.confidence === 'manual' ? '✓ YES (correct)' : '✗ NO (wrong)');
console.log();

// Test 5: Apply mapping transformation
console.log('=== TEST 5: Apply Mapping ===');
const testData = [
  { 'From': 'Addis Ababa', 'To': 'Hawassa', 'Date': '2026-02-01', 'Fare': '850' },
  { 'From': 'Hawassa', 'To': 'Addis Ababa', 'Date': '2026-02-02', 'Fare': '850' },
];
const mappingResult = autoDetectColumns(['From', 'To', 'Date', 'Fare']);
const mappedData = applyMapping(testData, mappingResult.mappings);
console.log('Original data:', testData[0]);
console.log('Mapped data:', mappedData[0]);
console.log('Fields transformed:', Object.keys(mappedData[0]).join(', '));
console.log();

// Test 6: Partial match (some columns recognized, some not)
console.log('=== TEST 6: Partial Match ===');
const partialHeaders = ['origin', 'destination', 'myDate', 'myTime', 'estimatedDuration', 'price', 'busType', 'totalSlots', 'driverPhone', 'conductorPhone', 'vehiclePlateNumber', 'preparedBy'];
const result6 = autoDetectColumns(partialHeaders);
console.log('Confidence:', result6.confidence);
console.log('Unmapped Required:', result6.unmappedRequired);
console.log();

console.log('========================================');
console.log('TEST SUMMARY');
console.log('========================================');
console.log('Test 1 (Exact):', result1.confidence === 'complete' ? '✓ PASS' : '✗ FAIL');
console.log('Test 2 (Variations):', result2.unmappedRequired.length === 0 ? '✓ PASS' : '✗ FAIL - Missing: ' + result2.unmappedRequired.join(', '));
console.log('Test 3 (Mixed):', result3.unmappedRequired.length === 0 ? '✓ PASS' : '✗ FAIL - Missing: ' + result3.unmappedRequired.join(', '));
console.log('Test 4 (Unknown):', result4.confidence === 'manual' ? '✓ PASS' : '✗ FAIL');
console.log('Test 5 (Transform):', mappedData[0].origin === 'Addis Ababa' ? '✓ PASS' : '✗ FAIL');
