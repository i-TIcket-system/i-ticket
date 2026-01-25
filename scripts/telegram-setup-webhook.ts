/**
 * Telegram Bot Webhook Setup Script
 * One-time script to register webhook with Telegram
 *
 * Usage:
 *   node scripts/telegram-setup-webhook.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables (try .env.local first, then .env.production)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// For local testing, allow override via WEBHOOK_URL env var
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://i-ticket.et";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in environment variables");
  process.exit(1);
}

if (!WEBHOOK_SECRET) {
  console.error("❌ TELEGRAM_WEBHOOK_SECRET not found in environment variables");
  console.error("   Generate one with: openssl rand -hex 32");
  process.exit(1);
}

async function setupWebhook() {
  const webhookEndpoint = `${WEBHOOK_URL}/api/telegram/webhook`;

  console.log("🤖 Telegram Bot Webhook Setup");
  console.log("================================");
  console.log(`Webhook URL: ${webhookEndpoint}`);
  console.log(`Secret Token: ${WEBHOOK_SECRET!.substring(0, 8)}...`);
  console.log("");

  try {
    // Step 1: Delete existing webhook (if any)
    console.log("🗑️  Deleting existing webhook...");

    const deleteResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const deleteResult = await deleteResponse.json();

    if (!deleteResult.ok) {
      console.warn("⚠️  Warning: Could not delete webhook:", deleteResult.description);
    } else {
      console.log("✅ Existing webhook deleted");
    }

    // Step 2: Set new webhook
    console.log("\n📡 Setting new webhook...");

    const setResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookEndpoint,
          secret_token: WEBHOOK_SECRET,
          allowed_updates: [
            "message",
            "callback_query",
            "inline_query",
            "chosen_inline_result",
          ],
          drop_pending_updates: true, // Clear pending updates
        }),
      }
    );

    const setResult = await setResponse.json();

    if (!setResult.ok) {
      console.error("❌ Failed to set webhook:", setResult.description);
      process.exit(1);
    }

    console.log("✅ Webhook set successfully!");

    // Step 3: Verify webhook
    console.log("\n🔍 Verifying webhook info...");

    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );

    const infoResult = await infoResponse.json();

    if (!infoResult.ok) {
      console.error("❌ Failed to get webhook info:", infoResult.description);
      process.exit(1);
    }

    const info = infoResult.result;

    console.log("\n📊 Webhook Info:");
    console.log(`   URL: ${info.url}`);
    console.log(`   Has custom certificate: ${info.has_custom_certificate}`);
    console.log(`   Pending update count: ${info.pending_update_count}`);
    console.log(`   Max connections: ${info.max_connections || "default (40)"}`);
    console.log(`   Allowed updates: ${info.allowed_updates?.join(", ") || "all"}`);

    if (info.last_error_date) {
      console.log(
        `\n⚠️  Last error: ${new Date(info.last_error_date * 1000).toISOString()}`
      );
      console.log(`   Error message: ${info.last_error_message}`);
    }

    // Step 4: Get bot info
    console.log("\n🤖 Bot Info:");

    const botResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
    );

    const botResult = await botResponse.json();

    if (botResult.ok) {
      const bot = botResult.result;
      console.log(`   Username: @${bot.username}`);
      console.log(`   Name: ${bot.first_name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Can read messages: ${bot.can_read_all_group_messages || false}`);
    }

    console.log("\n✅ Setup complete!");
    console.log(
      `\n🔗 Start chatting with your bot: https://t.me/${botResult.result.username}`
    );
    console.log(
      "\n💡 Tip: Send /start to your bot to test the webhook"
    );
  } catch (error: any) {
    console.error("\n❌ Error during setup:", error.message);
    process.exit(1);
  }
}

// Run setup
setupWebhook();
