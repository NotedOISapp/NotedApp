
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


const https = require('https');

console.log(`🔍 Checking Webhook Status for Token: ${token.substring(0, 5)}...`);
https.get(`https://api.telegram.org/bot${token}/getWebhookInfo`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error("❌ Invalid JSON:", data);
        }
    });
}).on('error', (e) => {
    console.error("❌ HTTPS Error:", e.message);
});
