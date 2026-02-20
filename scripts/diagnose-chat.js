
const https = require('https');

// REPLACE WITH YOUR VERCEL URL IF DIFFERENT
const BASE_URL = "https://mission-control-five-gilt.vercel.app";
const CHAT_ENDPOINT = `${BASE_URL}/api/chat`;

(async () => {
    console.log(`🔍 Diagnosing Web Chat API: ${CHAT_ENDPOINT}`);

    // Fix: Send 'message' key (Backend expects this) instead of 'messages' array
    const payload = JSON.stringify({
        message: "Status report, please."
    });

    const parsedUrl = new URL(CHAT_ENDPOINT);
    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
            console.log("Response Body:", data.substring(0, 500)); // Log first 500 chars

            if (res.statusCode === 200) {
                console.log("\n✅ Web Chat API is reachable and responding (200 OK).");
            } else {
                console.log(`\n❌ Web Chat API Failed with status ${res.statusCode}.`);
                console.log("Possible causes: Env Vars missing (SUPABASE, GOOGLE_API_KEY), or Code error.");
            }
        });
    });

    req.on('error', (e) => {
        console.error("Diagnostic Error:", e.message);
    });

    req.write(payload);
    req.end();
})();
