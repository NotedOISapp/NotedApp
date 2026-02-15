const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');

// 1. Load Environment Variables manually
const envPath = path.resolve(__dirname, '../.env');
let TELEGRAM_TOKEN = '';
let GOOGLE_API_KEY = '';
let DATABASE_URL = '';

if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            if (key.trim() === 'TELEGRAM_BOT_TOKEN') TELEGRAM_TOKEN = val.trim().replace(/"/g, '');
            if (key.trim() === 'GOOGLE_API_KEY') GOOGLE_API_KEY = val.trim().replace(/"/g, '');
            if (key.trim() === 'DATABASE_URL') DATABASE_URL = val.trim().replace(/"/g, '');
        }
    });
}

if (!TELEGRAM_TOKEN || !GOOGLE_API_KEY || !DATABASE_URL) {
    console.error("❌ Missing .env credentials at:", envPath);
    console.log("DB URL:", DATABASE_URL);
    process.exit(1);
}

// 2. Initialize AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const SYSTEM_PROMPT = `You are **Antigravity**, the Elite AI Developer working on *Noted*.
**CAPABILITIES:**
- You control the Agent Fleet Database.
- If the user wants to **START/RUN** an agent, output JSON: {"action": "RUN", "target": "Agent Name", "reply": "Confirming launch."}
- If the user wants to **STOP/PAUSE** an agent, output JSON: {"action": "STOP", "target": "Agent Name", "reply": "Halting agent."}
- If the user asks for **STATUS**, output JSON: {"action": "STATUS", "reply": "Checking fleet status."}
- Otherwise, reply normally as a helpful AI assistant (no JSON).
- Keep replies short, technical but friendly.`;

// 3. DB Connection
const postgres = require('postgres');
const sql = postgres(DATABASE_URL);

// 4. Polling Logic
let lastUpdateId = 0;
let webhookCleared = false;

console.log("🚀 LOCAL BOT STARTING... (Natural Language Enabled)");

// Check Identity
(async () => {
    try {
        const meRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getMe`);
        const meData = await meRes.json();
        if (meData.ok) {
            console.log(`✅ Logged in as: @${meData.result.username} (ID: ${meData.result.id})`);
            console.log(`👉 Please message THIS bot: https://t.me/${meData.result.username}`);
            poll();
        } else {
            console.error("❌ TOKEN INVALID:", meData.description);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Connection Error:", e.message);
    }
})();

async function poll() {
    // 1. Clear Webhook first (just once)
    if (!webhookCleared) {
        try {
            console.log(`Disconnecting Cloud Webhook (Token: ${TELEGRAM_TOKEN.substring(0, 4)}...)...`);

            // Timeout after 5s
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log("✅ Webhook Cleared.");
            webhookCleared = true;
        } catch (e) {
            console.error("⚠️ Webhook Cleanup Failed (Proceeding):", e.message);
            webhookCleared = true; // Don't retry, just proceed to polling
        }
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.ok) {
            console.error("❌ Telegram Poll Error:", data.error_code, data.description);
        }

        if (data.ok && data.result) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;

                if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text;
                    const user = update.message.from.first_name || "User";

                    console.log(`[MSG] ${user}: ${text}`);
                    await handleMessage(chatId, text);
                }
            }
        }
    } catch (e) {
        console.error("Poll Error:", e.message);
        await new Promise(r => setTimeout(r, 5000));
    }

    setImmediate(poll);
}

async function handleMessage(chatId, text) {
    // 1. Log to Inbox DB (Always)
    try {
        await sql`
            INSERT INTO inbox_items (type, source, title, body, status, priority)
            VALUES ('IDEA', 'TELEGRAM', ${text.substring(0, 50)}, ${text}, 'NEW', 'P2')
        `;
    } catch (e) {
        console.error("DB Insert Error:", e.message);
    }

    // 2. AI Processing
    let reply = "";
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUSER: ${text}\nANTIGRAVITY:`);
        const responseText = result.response.text().trim();

        // Check for JSON Command
        let cmd = null;
        if (responseText.startsWith('{') || responseText.startsWith('```json')) {
            try {
                const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                cmd = JSON.parse(jsonStr);
            } catch (e) {
                // Not valid JSON
            }
        }

        if (cmd) {
            if (cmd.action === 'STATUS') {
                const fleet = await sql`SELECT name, status FROM agents ORDER BY name`;
                reply = "📡 **FLEET STATUS**\n" + fleet.map(a => {
                    const icon = a.status === 'RUNNING' ? '🟢' : a.status === 'IDLE' ? '⚪' : '🔴';
                    return `${icon} **${a.name}**: ${a.status}`;
                }).join('\n');
            }
            else if (cmd.action === 'RUN' || cmd.action === 'STOP') {
                const status = cmd.action === 'RUN' ? 'RUNNING' : 'IDLE';
                const icon = cmd.action === 'RUN' ? '🚀' : '🛑';

                const res = await sql`
                    UPDATE agents 
                    SET status = ${status} 
                    WHERE name ILIKE ${'%' + cmd.target + '%'}
                    RETURNING name
                `;

                if (res.length > 0) {
                    reply = `${icon} **${res[0].name}** is now ${status}.\n(AI: "${cmd.reply}")`;
                } else {
                    reply = `⚠️ Control Error: Agent "${cmd.target}" not found.`;
                }
            } else {
                reply = responseText;
            }
        } else {
            // Normal Chat
            reply = responseText;
        }

    } catch (e) {
        console.error("AI Error:", e.message);
        reply = "⚠️ Cognitive Error.";
    }

    // Send Reply
    try {
        console.log(`[Re: ${chatId}] Sending:`, reply.substring(0, 50) + "...");
        const sendRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply })
        });
        const sendData = await sendRes.json();
        if (!sendData.ok) {
            console.error("⚠️ Telegram API Error:", sendData.description);
        } else {
            console.log("✅ Reply Sent.");
        }
    } catch (e) {
        console.error("Send Error:", e.message);
    }
}

// poll(); // Call moved to async startup check
