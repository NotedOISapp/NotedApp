const https = require('https');
const path = require('path');
const fs = require('fs');

// Simple .env parser since we might run this from different CWDs
function loadEnv() {
    try {
        // Try finding .env in mission-control root
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const [key, val] = line.split('=');
                if (key && val) process.env[key.trim()] = val.trim();
            });
        }
    } catch (e) { }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const message = process.argv[2] || "Ping from Antigravity.";

if (!token || !chatId) {
    console.error("Error: Credentials missing in .env");
    process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/sendMessage`;
const data = JSON.stringify({
    chat_id: chatId,
    text: message
});

const req = https.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    if (res.statusCode === 200) {
        console.log("Message Sent.");
    } else {
        console.error(`Error: ${res.statusCode}`);
    }
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
