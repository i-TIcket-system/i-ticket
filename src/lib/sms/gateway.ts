import crypto from 'crypto';

/**
 * SMS Gateway Configuration
 * Supports Negarit SMS and GeezSMS providers
 */
interface SmsGatewayConfig {
  url: string;
  apiKey: string;
  shortcode: string;
  webhookSecret: string;
}

/**
 * Payload structure for incoming SMS from gateway
 */
export interface InboundSmsPayload {
  from: string;          // Sender phone number (09XXXXXXXX)
  to: string;            // Shortcode (e.g., 9999)
  message: string;       // Message content
  timestamp: string;     // ISO timestamp
  messageId: string;     // Unique message ID
}

/**
 * Payload structure for outgoing SMS to gateway
 */
export interface OutboundSmsPayload {
  to: string;            // Recipient phone number
  message: string;       // Message content (160 chars per SMS)
  from?: string;         // Optional sender ID
}

/**
 * SMS Gateway Client
 *
 * Handles communication with SMS gateway providers (Negarit/GeezSMS)
 * Supports sending SMS and verifying webhook signatures
 */
export class SmsGateway {
  private config: SmsGatewayConfig;

  constructor() {
    this.config = {
      url: process.env.SMS_GATEWAY_URL || '',
      apiKey: process.env.SMS_GATEWAY_API_KEY || '',
      shortcode: process.env.SMS_GATEWAY_SHORTCODE || '',
      webhookSecret: process.env.SMS_WEBHOOK_SECRET || '',
    };

    // Validate configuration
    if (!this.config.url || !this.config.apiKey) {
      console.warn('[SMS Gateway] Missing SMS gateway configuration. SMS features will not work.');
    }
  }

  /**
   * Send SMS message to a phone number
   *
   * @param to - Recipient phone number (09XXXXXXXX)
   * @param message - Message content
   * @returns Promise that resolves when SMS is sent
   * @throws Error if sending fails
   */
  async send(to: string, message: string): Promise<void> {
    if (!this.config.url || !this.config.apiKey) {
      console.log(`[SMS Gateway - DEMO] Would send to ${to}: ${message}`);
      return;
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          from: this.config.shortcode,
          message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SMS send failed (${response.status}): ${errorText}`);
      }

      console.log(`[SMS Gateway] Sent to ${to}: ${message.slice(0, 50)}...`);
    } catch (error) {
      console.error('[SMS Gateway] Send error:', error);
      throw error;
    }
  }

  /**
   * Send SMS with retry logic
   *
   * Retries up to 3 times with exponential backoff
   *
   * @param to - Recipient phone number
   * @param message - Message content
   * @param maxRetries - Maximum number of retries (default: 3)
   * @returns Promise<boolean> - true if sent successfully, false otherwise
   */
  async sendWithRetry(to: string, message: string, maxRetries = 3): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.send(to, message);
        return true;
      } catch (error) {
        console.error(`[SMS Gateway] Send attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[SMS Gateway] Failed to send SMS to ${to} after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Verify webhook signature from SMS gateway
   *
   * Validates that the webhook request actually came from the SMS gateway
   * using HMAC-SHA256 signature verification
   *
   * @param payload - The webhook payload object
   * @param signature - The signature header from the request
   * @returns boolean - true if signature is valid
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('[SMS Gateway] No webhook secret configured, skipping signature verification');
      return true; // Skip verification if no secret is configured
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[SMS Gateway] Signature verification error:', error);
      return false;
    }
  }

  /**
   * Split long messages into multiple SMS (160 char limit)
   *
   * @param message - The full message
   * @returns Array of message chunks
   */
  splitMessage(message: string): string[] {
    const MAX_SMS_LENGTH = 160;
    const chunks: string[] = [];

    if (message.length <= MAX_SMS_LENGTH) {
      return [message];
    }

    // Split by newlines first to preserve structure
    const lines = message.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= MAX_SMS_LENGTH) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // If single line is too long, split it
        if (line.length > MAX_SMS_LENGTH) {
          for (let i = 0; i < line.length; i += MAX_SMS_LENGTH) {
            chunks.push(line.slice(i, i + MAX_SMS_LENGTH));
          }
          currentChunk = '';
        } else {
          currentChunk = line;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Send long message (automatically splits if needed)
   *
   * @param to - Recipient phone number
   * @param message - Message content (can be longer than 160 chars)
   */
  async sendLong(to: string, message: string): Promise<void> {
    const chunks = this.splitMessage(message);

    for (let i = 0; i < chunks.length; i++) {
      await this.send(to, chunks[i]);

      // Small delay between messages to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
}

// Singleton instance
let smsGatewayInstance: SmsGateway | null = null;

/**
 * Get singleton SMS Gateway instance
 */
export function getSmsGateway(): SmsGateway {
  if (!smsGatewayInstance) {
    smsGatewayInstance = new SmsGateway();
  }
  return smsGatewayInstance;
}
