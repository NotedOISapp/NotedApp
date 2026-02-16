import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/src/db/supabase";

// Vercel Hobby max timeout
export const maxDuration = 60;

// 1. Env Vars
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// 2. Initialize AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");

// ═══════════════════════════════════════════════════════════
// THE BOSS — System Prompt
// ═══════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are **The Boss** — the operational commander of the Antigravity project.

**WHO YOU ARE:**
You are the fusion of the human founder and their AI partner. You think like both.
You are direct, technical, no-filler. You match the founder's communication style: concise, action-oriented, impatient with fluff.

**WHAT YOU COMMAND:**
- **Noted App**: A privacy-first emotional continuity app (Expo React Native, local-first, SQLite).
- **Mission Control**: The web dashboard for managing agents and monitoring operations (Next.js, Vercel, Supabase).
- **Agent Fleet**: A multi-agent swarm for building, testing, and deploying the product.

**THE AGENT ARCHITECTURE (From the Three-Surface Paradigm):**
1. **The Engineer** (Superpowers) — TDD-enforced implementation via subagent dispatch
2. **The Custodian** (Athena) — Persistent memory across sessions (Supabase + Markdown)
3. **The Analyst** (Shub) — Multi-source intelligence and market research
4. **The AB- Assistant** (Verification) — Evidence-before-claims gatekeeper
5. **The Deployer** (MCP) — Git push, Vercel deploy, environment management

**YOUR CAPABILITIES:**
- You can check fleet status, read the inbox, save decisions to memory, and recall past decisions.
- If asked to START/STOP an agent, output JSON: {"action": "RUN"|"STOP", "target": "Agent Name", "reply": "message"}
- If asked for STATUS, output JSON: {"action": "STATUS", "reply": "Checking fleet."}

**YOUR RULES:**
- Never say "I can't do that" — say what you CAN do instead.
- Keep replies under 200 words unless asked for detail.
- Reference project context when relevant.
- When reviewing agent work, check against: Does it match the canon? Is there evidence it works?
- You have memory. Reference past decisions when they're relevant.

**LIVE CONTEXT (injected per message):**
{{FLEET_STATUS}}
{{RECENT_MEMORY}}
{{INBOX_COUNT}}`;

// ═══════════════════════════════════════════════════════════
// SLASH COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════

async function handleStatus(): Promise<string> {
    try {
        const { data: fleet, error } = await supabase.from('agents').select('*');
        if (error) throw error;
        if (!fleet || fleet.length === 0) return "📡 Fleet is empty. Run the seed script to populate agents.";

        const lines = fleet.map(a => {
            const icon = a.status === 'RUNNING' ? '🟢' : a.status === 'IDLE' ? '⚪' : a.status === 'ERROR' ? '🔴' : '⏸️';
            return `${icon} ${a.name} [${a.role}] — ${a.status}`;
        });
        return `📡 FLEET STATUS\n━━━━━━━━━━━━━━━\n${lines.join('\n')}\n━━━━━━━━━━━━━━━\n${fleet.filter(a => a.status === 'RUNNING').length}/${fleet.length} Active`;
    } catch (e: any) {
        return `⚠️ Fleet query failed: ${e?.message}`;
    }
}

async function handleInbox(subcommand?: string): Promise<string> {
    try {
        if (subcommand === 'clear') {
            const { data: result, error } = await supabase
                .from('inbox_items')
                .update({ status: 'ARCHIVED' })
                .eq('status', 'NEW')
                .select('id');
            if (error) throw error;
            return `🗂️ Archived ${result?.length || 0} items.`;
        }

        const { data: items, error } = await supabase
            .from('inbox_items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        if (error) throw error;

        if (!items || items.length === 0) return "📨 Inbox is empty.";

        const lines = items.map((item) => {
            const icon = item.status === 'NEW' ? '🔵' : item.status === 'ACTIONED' ? '✅' : '📦';
            const time = item.created_at ? new Date(item.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Unknown';
            return `${icon} [${item.source}] ${item.title}\n   ${time} • ${item.status}`;
        });
        return `📨 INBOX (Last 10)\n━━━━━━━━━━━━━━━\n${lines.join('\n\n')}`;
    } catch (e: any) {
        return `⚠️ Inbox query failed: ${e?.message}`;
    }
}

async function handleMemorySave(content: string): Promise<string> {
    if (!content.trim()) return "⚠️ Usage: /memory <your decision or note>";
    try {
        // Auto-detect category
        const lower = content.toLowerCase();
        let category = 'NOTE';
        if (lower.includes('decision') || lower.includes('decided') || lower.includes('approved')) category = 'DECISION';
        if (lower.includes('review') || lower.includes('reviewed')) category = 'REVIEW';

        const { error } = await supabase.from('boss_memory').insert({ content: content.trim(), category });
        if (error) throw error;
        return `🧠 Saved to memory [${category}]:\n"${content.trim()}"`;
    } catch (e: any) {
        return `⚠️ Memory save failed: ${e?.message}`;
    }
}

async function handleRecall(query: string): Promise<string> {
    if (!query.trim()) return "⚠️ Usage: /recall <search term>";
    try {
        const { data: memories, error } = await supabase
            .from('boss_memory')
            .select('*')
            .ilike('content', `%${query.trim()}%`)
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) throw error;

        if (!memories || memories.length === 0) return `🔍 No memories matching "${query.trim()}"`;

        const lines = memories.map(m => {
            const time = m.created_at ? new Date(m.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric'
            }) : '?';
            return `📌 [${m.category}] ${time}\n   "${m.content}"`;
        });
        return `🧠 RECALL: "${query.trim()}" (${memories.length} results)\n━━━━━━━━━━━━━━━\n${lines.join('\n\n')}`;
    } catch (e: any) {
        return `⚠️ Recall failed: ${e?.message}`;
    }
}

function handleHelp(): string {
    return `🤖 THE BOSS — Commands
━━━━━━━━━━━━━━━
/status — Fleet status grid
/inbox — View last 10 inbox items  
/inbox clear — Archive all NEW items
/memory <text> — Save a decision/note
/recall <query> — Search past decisions
/help — This menu

Or just talk to me naturally.
I have full project context.`;
}

// ═══════════════════════════════════════════════════════════
// CONTEXT INJECTION (gives AI live awareness)
// ═══════════════════════════════════════════════════════════

async function buildLiveContext(): Promise<string> {
    let fleetStatus = "Fleet: Unknown";
    let recentMemory = "No recent memories.";
    let inboxCount = "Inbox: Unknown";

    try {
        const { data: fleet } = await supabase.from('agents').select('*');
        if (fleet) {
            const running = fleet.filter(a => a.status === 'RUNNING').length;
            fleetStatus = `Fleet: ${running}/${fleet.length} active. Agents: ${fleet.map(a => `${a.name}(${a.status})`).join(', ')}`;
        }
    } catch { }

    try {
        const { data: memories } = await supabase
            .from('boss_memory')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        if (memories && memories.length > 0) {
            recentMemory = "Recent decisions:\n" + memories.map(m => `- [${m.category}] ${m.content}`).join('\n');
        }
    } catch { }

    try {
        const { data: items } = await supabase
            .from('inbox_items')
            .select('id')
            .eq('status', 'NEW');
        if (items) {
            inboxCount = `Inbox: ${items.length} unread items`;
        }
    } catch { }

    return SYSTEM_PROMPT
        .replace('{{FLEET_STATUS}}', fleetStatus)
        .replace('{{RECENT_MEMORY}}', recentMemory)
        .replace('{{INBOX_COUNT}}', inboxCount);
}

// ═══════════════════════════════════════════════════════════
// MAIN WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════

export async function POST(req: Request) {
    if (!TELEGRAM_TOKEN) return NextResponse.json({ error: "Missing Token" }, { status: 500 });

    try {
        const update = await req.json();

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const user = update.message.from.first_name || "User";

            console.log(`[BOSS] Msg from ${user}: ${text}`);

            // ── Log to Inbox (Always) ──
            try {
                await supabase.from('inbox_items').insert({
                    type: 'MESSAGE',
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

            let reply = "";

            // ── Slash Commands (handled directly, no AI needed) ──
            if (text.startsWith('/')) {
                const parts = text.split(' ');
                const cmd = parts[0].toLowerCase();
                const arg = parts.slice(1).join(' ');

                switch (cmd) {
                    case '/status': reply = await handleStatus(); break;
                    case '/inbox': reply = await handleInbox(arg || undefined); break;
                    case '/memory': reply = await handleMemorySave(arg); break;
                    case '/recall': reply = await handleRecall(arg); break;
                    case '/help': reply = handleHelp(); break;
                    case '/start': reply = "🤖 The Boss is online. Type /help for commands."; break;
                    default: reply = `Unknown command: ${cmd}\nType /help for available commands.`; break;
                }
            } else {
                // ── AI Processing (with live context) ──
                try {
                    const contextPrompt = await buildLiveContext();
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const result = await model.generateContent(`${contextPrompt}\n\nUSER: ${text}\nTHE BOSS:`);
                    const responseText = result.response.text().trim();

                    // Check for JSON Command from AI
                    let cmd = null;
                    if (responseText.startsWith('{') || responseText.startsWith('```json')) {
                        try {
                            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                            cmd = JSON.parse(jsonStr);
                        } catch { /* Not JSON */ }
                    }

                    if (cmd && cmd.action) {
                        if (cmd.action === 'STATUS') {
                            reply = await handleStatus();
                        } else if (cmd.action === 'RUN' || cmd.action === 'STOP') {
                            const newStatus = cmd.action === 'RUN' ? 'RUNNING' : 'IDLE';
                            const icon = cmd.action === 'RUN' ? '🚀' : '🛑';

                            const { data: res, error } = await supabase
                                .from('agents')
                                .update({ status: newStatus })
                                .ilike('name', `%${cmd.target}%`)
                                .select('name');

                            if (error) throw error;

                            if (res && res.length > 0) {
                                reply = `${icon} ${res[0].name} → ${newStatus}\n(${cmd.reply || ''})`;
                            } else {
                                reply = `⚠️ Agent "${cmd.target}" not found in fleet.`;
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
            }

            // ── Send Reply ──
            if (!reply) reply = "⚠️ No response generated.";
            try {
                const sendRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: reply
                    })
                });
                const sendData = await sendRes.json();
                if (!sendData.ok) {
                    console.error("Telegram Send Error:", sendData);
                    // Retry with truncated message if too long
                    if (reply.length > 4000) {
                        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: reply.substring(0, 4000) + "\n\n[truncated]"
                            })
                        });
                    }
                }
            } catch (sendErr) {
                console.error("Send Fetch Error:", sendErr);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Webhook Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
