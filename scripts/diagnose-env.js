const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found!");
    process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

let token = '';

lines.forEach(line => {
    if (line.trim().startsWith('TELEGRAM_BOT_TOKEN=')) {
        const parts = line.split('=');
        // Rejoin rest in case of = in value (rare for tokens but good practice)
        let val = parts.slice(1).join('=');
        // Clean quotes/whitespace exactly like local-bot.js
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        token = val;
    }
});

console.log("🔍 DIAGNOSING TELEGRAM_BOT_TOKEN...");

if (!token) {
    console.error("❌ Token not found in .env");
    process.exit(1);
}

console.log(`Length: ${token.length}`);
console.log(`First 3 chars: "${token.substring(0, 3)}"`);
console.log(`Last 3 chars:  "${token.substring(token.length - 3)}"`);

if (token.toLowerCase().startsWith('bot')) {
    console.error("❌ ERROR: Token starts with 'bot'. Remove the 'bot' prefix!");
    console.log("   Correct format: 123456789:ABCDefGhi...");
} else {
    console.log("✅ Prefix check: OK (Does not start with 'bot')");
}

if (token.includes(' ')) {
    console.error("❌ ERROR: Token contains spaces!");
} else {
    console.log("✅ Spacing check: OK");
}

if (!token.includes(':')) {
    console.error("❌ ERROR: Token missing ':' separator.");
} else {
    console.log("✅ Structure check: OK (Contains ':')");
}

// Check for invalid chars
if (/[^a-zA-Z0-9:_-]/.test(token)) {
    console.error("❌ ERROR: Token contains invalid characters (non-alphanumeric/dash/underscore).");
} else {
    console.log("✅ Character check: OK");
}
