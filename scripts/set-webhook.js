const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN.includes('Hidden')) {
    console.error("❌ Valid TELEGRAM_BOT_TOKEN not found in .env");
    process.exit(1);
}

console.log("🔗 SETUP CLOUD WEBHOOK");
console.log("To run the bot 24/7 on Vercel, we need to tell Telegram where to send messages.");
console.log("Your Vercel URL should look like: https://mission-control-xyz.vercel.app");

rl.question('Please paste your Vercel Project URL (e.g., https://myapp.vercel.app): ', async (urlInput) => {
    let url = urlInput.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);

    if (!url.startsWith('https://')) {
        console.error("❌ URL must start with https://");
        rl.close();
        return;
    }

    const webhookUrl = `${url}/api/telegram`;
    console.log(`\nSetting Webhook to: ${webhookUrl}`);

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();

        if (data.ok) {
            console.log("✅ WEBHOOK SET SUCCESSFULLY!");
            console.log("Telegram will now push messages to your Vercel app.");
            console.log("NOTE: You must 'git push' the latest code (route.ts) to Vercel for this to work.");
            console.log("NOTE: Ensure TELEGRAM_BOT_TOKEN and GOOGLE_API_KEY are set in Vercel Project Settings.");
        } else {
            console.error("❌ Webhook Error:", data.description);
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }
    rl.close();
});
