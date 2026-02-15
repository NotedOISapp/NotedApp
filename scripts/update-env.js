const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ .env not found");
    process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');

// Replace Token Safe
const newToken = 'TELEGRAM_BOT_TOKEN="8536430191:AAHzjW2w7ogOQ6MBZQS-lqL6LWloPwyaxCI"';

if (content.match(/^TELEGRAM_BOT_TOKEN=/m)) {
    // property exists, replace it
    content = content.replace(/^TELEGRAM_BOT_TOKEN=.*$/m, newToken);
} else {
    // Append if missing
    content += `\n${newToken}`;
}

fs.writeFileSync(envPath, content);
console.log("✅ Updated TELEGRAM_BOT_TOKEN in .env");
