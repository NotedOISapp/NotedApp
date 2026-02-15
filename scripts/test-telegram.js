const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
    process.exit(1);
}

const message = "System Link Established via Antigravity Relay.";

const url = `https://api.telegram.org/bot${token}/sendMessage`;
const data = JSON.stringify({
    chat_id: chatId,
    text: message
});

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(url, options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("Message Sent Successfully:", JSON.parse(body).ok);
        } else {
            console.error("Error Sending Message:", body);
        }
    });
});

req.on('error', (e) => {
    console.error("Request Error:", e);
});

req.write(data);
req.end();
