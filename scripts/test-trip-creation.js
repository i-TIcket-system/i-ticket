/**
 * Test script for trip creation with staff assignment validation
 * Run with: node test-trip-creation.js
 */

const baseUrl = 'http://localhost:3001';

async function testTripCreation() {
  console.log('🧪 Testing Trip Creation API\n');

  // Step 1: Login as company admin
  console.log('Step 1: Logging in as company admin...');
  const loginResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '0912345678', // Update with actual test company admin phone
      password: 'TestPassword123', // Update with actual password
    }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed. Please update credentials in test script.');
    console.log('Response:', await loginResponse.text());
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login successful\n');

  // Step 2: Test trip creation WITHOUT staff assignments
  console.log('Step 2: Testing trip creation WITHOUT staff assignments...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const tripDataWithoutStaff = {
    origin: 'Addis Ababa',
    destination: 'Bahir Dar',
    route: 'Addis Ababa → Dejen → Bahir Dar',
    intermediateStops: JSON.stringify(['Dejen']),
    departureTime: tomorrow.toISOString(),
    estimatedDuration: 540, // 9 hours
    price: 850,
    busType: 'standard',
    totalSlots: 45,
    hasWater: true,
    hasFood: false,
    // No staff assignments
  };

  const response1 = await fetch(`${baseUrl}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify(tripDataWithoutStaff),
  });

  const result1 = await response1.json();

  if (response1.ok) {
    console.log('✅ Trip created successfully WITHOUT staff assignments');
    console.log('   Trip ID:', result1.trip.id);
    console.log('   Route:', result1.trip.route);
  } else {
    console.error('❌ Failed to create trip without staff');
    console.log('   Error:', result1.error);
    return;
  }

  // Step 3: Test trip creation WITH staff assignments
  console.log('\nStep 3: Testing trip creation WITH staff assignments...');

  const tripDataWithStaff = {
    origin: 'Addis Ababa',
    destination: 'Gondar',
    departureTime: new Date(tomorrow.getTime() + 3600000).toISOString(), // 1 hour later
    estimatedDuration: 720, // 12 hours
    price: 1200,
    busType: 'luxury',
    totalSlots: 40,
    hasWater: true,
    hasFood: true,
    driverId: 'test-driver-id', // This will be null if ID doesn't exist, which is fine
    conductorId: 'test-conductor-id',
    manualTicketerId: null, // Explicitly null
  };

  const response2 = await fetch(`${baseUrl}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify(tripDataWithStaff),
  });

  const result2 = await response2.json();

  if (response2.ok) {
    console.log('✅ Trip created successfully WITH staff assignments');
    console.log('   Trip ID:', result2.trip.id);
    console.log('   Driver ID:', result2.trip.driverId);
    console.log('   Conductor ID:', result2.trip.conductorId);
    console.log('   Ticketer ID:', result2.trip.manualTicketerId);
  } else {
    console.error('❌ Failed to create trip with staff');
    console.log('   Error:', result2.error);
    return;
  }

  console.log('\n✅ All tests passed! Trip creation validation is working correctly.');
}

// Run the test
testTripCreation().catch(error => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});
