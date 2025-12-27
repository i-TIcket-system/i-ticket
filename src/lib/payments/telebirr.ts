import crypto from 'crypto';

/**
 * TeleBirr Payment Integration
 *
 * Supports merchant-initiated payments (push payment to user's phone)
 * User receives MMI/USSD popup and enters password to confirm
 */

/**
 * TeleBirr payment request parameters
 */
interface TelebirrPaymentRequest {
  phone: string;        // User's phone (0912345678)
  amount: number;       // Amount in ETB
  reference: string;    // Booking ID or transaction reference
  description?: string; // Optional payment description
}

/**
 * TeleBirr API response
 */
interface TelebirrPaymentResponse {
  code: string;           // "0" = success, other = error
  msg: string;            // Status message
  data?: {
    transactionId: string; // TeleBirr transaction ID
    status: string;        // "PENDING" initially
  };
}

/**
 * TeleBirr payment callback payload
 */
export interface TelebirrCallbackPayload {
  transactionId: string;    // TeleBirr transaction ID
  outTradeNo: string;       // Our booking ID
  status: string;           // "SUCCESS" or "FAILED"
  amount: string;           // Amount in ETB
  currency: string;         // "ETB"
  timestamp: string;        // ISO timestamp
  signature: string;        // HMAC signature
}

/**
 * Generate HMAC-SHA256 signature for TeleBirr API
 *
 * @param params - Parameters to sign
 * @returns Signature string
 */
function generateTelebirrSignature(params: Record<string, any>): string {
  // Remove signature field if present
  const { signature, ...paramsToSign } = params;

  // Sort parameters alphabetically
  const sorted = Object.keys(paramsToSign).sort().reduce((acc, key) => {
    if (paramsToSign[key] !== undefined && paramsToSign[key] !== null) {
      acc[key] = paramsToSign[key];
    }
    return acc;
  }, {} as Record<string, any>);

  // Create query string
  const queryString = new URLSearchParams(sorted as any).toString();

  // HMAC-SHA256 with app key
  const appKey = process.env.TELEBIRR_APP_KEY || '';
  const computedSignature = crypto
    .createHmac('sha256', appKey)
    .update(queryString)
    .digest('hex');

  return computedSignature;
}

/**
 * Verify TeleBirr callback signature
 *
 * @param payload - Callback payload with signature
 * @returns true if signature is valid
 */
export function verifyTelebirrSignature(payload: TelebirrCallbackPayload): boolean {
  const { signature, ...params } = payload;

  if (!signature) {
    console.error('[TeleBirr] No signature in callback payload');
    return false;
  }

  const expectedSignature = generateTelebirrSignature(params);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[TeleBirr] Signature verification error:', error);
    return false;
  }
}

/**
 * Initiate merchant-initiated payment (push payment to user's phone)
 *
 * This sends a payment request to the user's phone via TeleBirr.
 * The user receives an MMI/USSD popup and enters their password to approve.
 *
 * @param params - Payment request parameters
 * @returns Transaction ID if successful
 * @throws Error if payment initiation fails
 */
export async function initiateTelebirrPayment(
  params: TelebirrPaymentRequest
): Promise<{ transactionId: string }> {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.TELEBIRR_APP_ID;

  // Demo mode - simulate payment initiation
  if (isDemoMode) {
    const mockTransactionId = `DEMO-TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[TeleBirr DEMO] Payment initiated for ${params.phone}: ${params.amount} ETB`);
    console.log(`[TeleBirr DEMO] Transaction ID: ${mockTransactionId}`);
    console.log(`[TeleBirr DEMO] Reference: ${params.reference}`);

    return { transactionId: mockTransactionId };
  }

  // Production mode - call TeleBirr API
  try {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    const payload = {
      appId: process.env.TELEBIRR_APP_ID!,
      nonce,
      timestamp,
      amount: params.amount.toFixed(2),
      phone: params.phone,
      outTradeNo: params.reference,
      notifyUrl: process.env.TELEBIRR_NOTIFY_URL!,
      subject: params.description || 'i-Ticket Bus Booking',
      merchantCode: process.env.TELEBIRR_MERCHANT_CODE || 'ITICKET001',
    };

    const signature = generateTelebirrSignature(payload);

    const response = await fetch(
      `${process.env.TELEBIRR_API_URL}/payment/request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, signature })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TeleBirr API error (${response.status}): ${errorText}`);
    }

    const data: TelebirrPaymentResponse = await response.json();

    if (data.code !== '0') {
      throw new Error(`TeleBirr error: ${data.msg}`);
    }

    if (!data.data?.transactionId) {
      throw new Error('TeleBirr response missing transaction ID');
    }

    console.log(`[TeleBirr] Payment initiated: ${data.data.transactionId}`);
    console.log(`[TeleBirr] Phone: ${params.phone}, Amount: ${params.amount} ETB`);

    // Payment request sent - user will receive MMI popup immediately
    return { transactionId: data.data.transactionId };
  } catch (error) {
    console.error('[TeleBirr] Payment initiation error:', error);
    throw error;
  }
}

/**
 * Check payment status (for polling or manual checks)
 *
 * @param transactionId - TeleBirr transaction ID
 * @returns Payment status
 */
export async function checkPaymentStatus(
  transactionId: string
): Promise<{ status: string; amount?: number }> {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.TELEBIRR_APP_ID;

  if (isDemoMode) {
    // In demo mode, auto-approve after 5 seconds
    console.log(`[TeleBirr DEMO] Checking status for ${transactionId}`);
    return { status: 'SUCCESS', amount: 100 };
  }

  // Production mode - call TeleBirr status API
  try {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    const payload = {
      appId: process.env.TELEBIRR_APP_ID!,
      nonce,
      timestamp,
      transactionId
    };

    const signature = generateTelebirrSignature(payload);

    const response = await fetch(
      `${process.env.TELEBIRR_API_URL}/payment/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, signature })
      }
    );

    if (!response.ok) {
      throw new Error(`TeleBirr status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      status: data.data?.status || 'PENDING',
      amount: data.data?.amount ? parseFloat(data.data.amount) : undefined
    };
  } catch (error) {
    console.error('[TeleBirr] Status check error:', error);
    throw error;
  }
}

/**
 * Format phone number for TeleBirr
 * Ensures Ethiopian format (09XXXXXXXX)
 *
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export function formatPhoneForTelebirr(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Remove +251 country code if present
  if (cleaned.startsWith('+251')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Ensure starts with 09
  if (!cleaned.startsWith('09')) {
    console.warn(`[TeleBirr] Invalid phone format: ${phone}`);
  }

  return cleaned;
}

/**
 * Calculate TeleBirr transaction fee
 * TeleBirr typically charges 1% with minimum fee
 *
 * @param amount - Transaction amount in ETB
 * @returns Fee amount in ETB
 */
export function calculateTelebirrFee(amount: number): number {
  const percentageFee = amount * 0.01; // 1%
  const minimumFee = 5; // 5 ETB minimum

  return Math.max(percentageFee, minimumFee);
}
