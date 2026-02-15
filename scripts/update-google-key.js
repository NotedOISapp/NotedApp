const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ .env not found");
    process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');

// Replace Google Key
// Using regex to match GOOGLE_API_KEY=... until end of line
// The key provided by user: AIzaSyCMJp1-5YQKNU1hlxDFPy578hKS0CYJGWc

const newKeyLine = 'GOOGLE_API_KEY="AIzaSyCMJp1-5YQKNU1hlxDFPy578hKS0CYJGWc"';

if (content.match(/^GOOGLE_API_KEY=/m)) {
    content = content.replace(/^GOOGLE_API_KEY=.*$/m, newKeyLine);
} else {
    // Append if missing
    content += `\n${newKeyLine}`;
}

fs.writeFileSync(envPath, content);
console.log("✅ Updated GOOGLE_API_KEY in .env");
