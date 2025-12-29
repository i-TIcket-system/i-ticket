/**
 * SMS Bot Test Script
 *
 * Simulates SMS messages being sent to the bot to test the complete booking flow
 * Run with: node test-sms-bot.js
 */

const TEST_PHONE = '0912345678';
const API_URL = 'http://localhost:3000';

/**
 * Simulate sending an SMS to the bot
 */
async function sendSms(from, message) {
  console.log(`\n📱 [USER ${from}]: ${message}`);

  const response = await fetch(`${API_URL}/api/sms/incoming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: '9999',
      message,
      timestamp: new Date().toISOString(),
      messageId: `msg_${Date.now()}`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Error: ${error}`);
    return null;
  }

  const data = await response.json();

  // Small delay to let SMS be sent
  await new Promise(resolve => setTimeout(resolve, 1000));

  return data;
}

/**
 * Wait for user input in terminal
 */
function waitForEnter() {
  return new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
}

/**
 * Main test flow
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 i-Ticket SMS Bot Test - Demo Mode');
  console.log('='.repeat(60));
  console.log(`\nTesting with phone: ${TEST_PHONE}`);
  console.log('\nThis will simulate a complete booking flow:');
  console.log('1. Search trips');
  console.log('2. Select trip');
  console.log('3. Enter passenger details');
  console.log('4. Confirm booking');
  console.log('5. Process payment');
  console.log('6. Receive ticket\n');
  console.log('Press ENTER to start...');

  await waitForEnter();

  // Test 1: Help command
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Help Command');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, 'HELP');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Book command with full parameters
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Search Trips (BOOK ADDIS HAWASSA TODAY)');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, 'BOOK ADDIS HAWASSA TODAY');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Select trip #1
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Select Trip #1');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, '1');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Enter passenger count
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Enter Passenger Count (1 passenger)');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, '1');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: Enter passenger name
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Enter Passenger Name');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, 'Abebe Kebede');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 6: Enter passenger ID
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Enter Passenger National ID');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, 'A123456');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 7: Confirm booking
  console.log('\n' + '='.repeat(60));
  console.log('TEST 7: Confirm Booking (YES)');
  console.log('='.repeat(60));
  await sendSms(TEST_PHONE, 'YES');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test flow completed!');
  console.log('='.repeat(60));
  console.log('\nCheck the console logs above to see bot responses.');
  console.log('In demo mode, SMS messages are logged to the server console.');
  console.log('\nTo see actual bot responses, check your Next.js server logs.');
  console.log('\n' + '='.repeat(60));

  process.exit(0);
}

// Run the test
runTest().catch(console.error);
