#!/bin/bash

# SMS Bot Complete Flow Test
# Tests the entire booking flow from search to ticket delivery

API_URL="http://localhost:3000"
PHONE="0911223344"

echo "======================================================================"
echo "🧪 i-Ticket SMS Bot - Complete Booking Flow Test"
echo "======================================================================"
echo ""
echo "Phone: $PHONE"
echo "Testing complete flow: Search → Select → Book → Pay → Ticket"
echo ""

# Function to send SMS
send_sms() {
    local message="$1"
    local msg_id="msg_$(date +%s)"

    echo ""
    echo "📱 USER: $message"
    echo "----------------------------------------------------------------------"

    response=$(curl -s -X POST "$API_URL/api/sms/incoming" \
        -H "Content-Type: application/json" \
        -d "{\"from\":\"$PHONE\",\"to\":\"9999\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"messageId\":\"$msg_id\"}")

    echo "✅ Webhook response: $response"
    sleep 2

    echo ""
    echo "🤖 BOT RESPONSE (check server logs above)"
    echo "----------------------------------------------------------------------"
    sleep 1
}

# Test Flow
echo "Press ENTER to continue between steps..."
read -p ""

# Step 1: Search trips
echo ""
echo "STEP 1: Search for trips"
send_sms "BOOK ADDIS HAWASSA TODAY"
read -p "Press ENTER for next step..."

# Step 2: Select trip #1
echo ""
echo "STEP 2: Select trip #1"
send_sms "1"
read -p "Press ENTER for next step..."

# Step 3: Enter passenger count
echo ""
echo "STEP 3: Enter passenger count (2 passengers)"
send_sms "2"
read -p "Press ENTER for next step..."

# Step 4: Enter first passenger name
echo ""
echo "STEP 4: Enter first passenger name"
send_sms "Abebe Kebede"
read -p "Press ENTER for next step..."

# Step 5: Enter first passenger ID
echo ""
echo "STEP 5: Enter first passenger ID"
send_sms "A123456"
read -p "Press ENTER for next step..."

# Step 6: Enter second passenger name
echo ""
echo "STEP 6: Enter second passenger name"
send_sms "Almaz Tesfaye"
read -p "Press ENTER for next step..."

# Step 7: Enter second passenger ID
echo ""
echo "STEP 7: Enter second passenger ID"
send_sms "B789012"
read -p "Press ENTER for next step..."

# Step 8: Confirm booking
echo ""
echo "STEP 8: Confirm booking (YES)"
send_sms "YES"
sleep 3

echo ""
echo "======================================================================"
echo "✅ Complete flow test finished!"
echo "======================================================================"
echo ""
echo "Check your Next.js server console to see all bot responses."
echo "In demo mode, all SMS messages are logged to console."
echo ""
echo "Expected flow:"
echo "  1. Trip search results (2 trips found)"
echo "  2. Trip selection confirmation"
echo "  3. Passenger count prompt"
echo "  4. Name prompts for each passenger"
echo "  5. ID prompts for each passenger"
echo "  6. Booking summary"
echo "  7. Payment initiated (demo auto-succeeds)"
echo "  8. Tickets sent via SMS (2 tickets)"
echo ""
echo "======================================================================"
