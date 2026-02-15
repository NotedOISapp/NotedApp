import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/src/db";
import { agents, inboxItems } from "@/src/db/schema";
import { ilike } from "drizzle-orm";

// Vercel Hobby max timeout (prevents early kill during AI calls)
export const maxDuration = 60;

// 1. Env Vars
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// 2. Initialize AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");
const SYSTEM_PROMPT = `You are **Antigravity**, the Elite AI Developer working on *Just Be*.
**CAPABILITIES:**
- You control the Agent Fleet Database.
- If the user wants to **START/RUN** an agent, output JSON: {"action": "RUN", "target": "Agent Name", "reply": "Confirming launch."}
- If the user wants to **STOP/PAUSE** an agent, output JSON: {"action": "STOP", "target": "Agent Name", "reply": "Halting agent."}
- If the user asks for **STATUS**, output JSON: {"action": "STATUS", "reply": "Checking fleet status."}
- Otherwise, reply normally as a helpful AI assistant (no JSON).
- Keep replies short, technical but friendly.`;

export async function POST(req: Request) {
    if (!TELEGRAM_TOKEN) return NextResponse.json({ error: "Missing Token" }, { status: 500 });

    // Security: Check X-Telegram-Bot-Api-Secret-Token if you set it (Optional for now)

    try {
        const update = await req.json();

        // Handle Message
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const user = update.message.from.first_name || "User";

            console.log(`[WEBHOOK] Msg from ${user}: ${text}`);

            // 1. Log to Inbox (Always)
            try {
                await db.insert(inboxItems).values({
                    type: 'IDEA',
                    source: 'TELEGRAM',
                    title: text.substring(0, 50),
                    body: text,
                    status: 'NEW',
                    priority: 'P2',
                    metadata: { chatId, user }
                });
            } catch (e) {
                console.error("Inbox Log Error:", e);
            }

            // 2. AI Processing
            let reply = "";
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUSER: ${text}\nANTIGRAVITY:`);
                const responseText = result.response.text().trim();

                // Check for JSON Command
                let cmd = null;
                if (responseText.startsWith('{') || responseText.startsWith('```json')) {
                    try {
                        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                        cmd = JSON.parse(jsonStr);
                    } catch (e) { /* Not JSON */ }
                }

                if (cmd) {
                    if (cmd.action === 'STATUS') {
                        const fleet = await db.select().from(agents);
                        reply = "📡 **FLEET STATUS**\n" + fleet.map(a => {
                            const icon = a.status === 'RUNNING' ? '🟢' : a.status === 'IDLE' ? '⚪' : '🔴';
                            return `${icon} **${a.name}**: ${a.status}`;
                        }).join('\n');
                    }
                    else if (cmd.action === 'RUN' || cmd.action === 'STOP') {
                        const newStatus = cmd.action === 'RUN' ? 'RUNNING' : 'IDLE';
                        const icon = cmd.action === 'RUN' ? '🚀' : '🛑';

                        // Update DB
                        const res = await db.update(agents)
                            .set({ status: newStatus })
                            .where(ilike(agents.name, `%${cmd.target}%`))
                            .returning({ name: agents.name });

                        if (res.length > 0) {
                            reply = `${icon} **${res[0].name}** is now ${newStatus}.\n(AI: "${cmd.reply}")`;
                        } else {
                            reply = `⚠️ Control Error: Agent "${cmd.target}" not found.`;
                        }
                    } else {
                        reply = responseText;
                    }
                } else {
                    reply = responseText;
                }

            } catch (e: any) {
                console.error("AI Error:", e);
                reply = `⚠️ AI Error: ${e?.message || 'Unknown error'}`;
            }

            // 3. Send Reply
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: reply })
            });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Webhook Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
