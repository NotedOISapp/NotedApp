
const https = require('https');

const VERCEL_URL = "https://mission-control-five-gilt.vercel.app/api/telegram";

(async () => {
    console.log(`🔍 Diagnosing: ${VERCEL_URL}`);

    // Simulate a simple "Start" command from Telegram
    const payload = JSON.stringify({
        update_id: 123456789,
        message: {
            message_id: 1,
            from: {
                id: 12345,
                is_bot: false,
                first_name: "DiagnosticUser",
                username: "diagnostic_user"
            },
            chat: {
                id: 12345,
                first_name: "DiagnosticUser",
                username: "diagnostic_user",
                type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: "/start"
        }
    });

    const parsedUrl = new URL(VERCEL_URL);
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
            console.log("Response Body:", data.substring(0, 500));

            if (res.statusCode === 200) {
                console.log("\n✅ API is reachable and responding (200 OK).");
            } else {
                console.log(`\n❌ API Failed with status ${res.statusCode}.`);
            }
        });
    });

    req.on('error', (e) => {
        console.error("Diagnostic Error:", e.message);
    });

    req.write(payload);
    req.end();
})();
