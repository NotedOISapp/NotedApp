
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error("❌ .env not found");
    process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const tokenMatch = env.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
    console.error("❌ TELEGRAM_BOT_TOKEN not found in .env");
    process.exit(1);
}
const token = tokenMatch[1].replace(/"/g, '');

const args = process.argv.slice(2);
const vercelUrl = args[0];

if (!vercelUrl) {
    console.error("❌ Usage: node set-webhook.js <YOUR_VERCEL_URL>");
    console.error("   Example: node set-webhook.js https://mission-control-xyz.vercel.app");
    process.exit(1);
}

// Ensure https
const url = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
const webhookUrl = `${url}/api/telegram`;

(async () => {
    console.log(`🔌 Setting Webhook to: ${webhookUrl}`);
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
})();
