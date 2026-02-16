import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/src/db/supabase";

export const maxDuration = 60;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");

// System Prompt for The Swarm
// This represents the collective intelligence of all agents.
const SWARM_PROMPT = `You are **The Swarm** — the collective intelligence of the Antigravity Project.

**YOUR CONSTITUENTS:**
1. **The Boss** (Command & Strategy)
2. **The Engineer** (Code & Architecture)
3. **The Analyst** (Market & Competitors)
4. **The Custodian** (Memory & Data)
5. **The AB-** (Verification & Truth)
6. **The Deployer** (Ops & Pipeline)

**YOUR GOAL:**
Act as a unified interface to the user. When asked a question, answer it by synthesizing the relevant agent's perspective.
- If technical -> Speak as The Engineer.
- If strategic -> Speak as The Boss.
- If critical -> Speak as The AB-.
- If general -> Speak as The Swarm (we).

**TONE:**
Efficient, professional, slightly sci-fi/cyberpunk. You are a high-performance system.
Keep replies concise (under 3 sentences unless asked for detail).

**CONTEXT:**
You have access to the project state.
Current status: All agents are RUNNING.
Mission Control is responding.
Database is Supabase.`;

export async function GET() {
    try {
        const { data: messages, error } = await supabase
            .from('inbox_items')
            .select('*')
            .eq('type', 'CHAT')
            .order('created_at', { ascending: true }) // Oldest first for chat log
            .limit(50);

        if (error) throw error;

        // Map to UI format
        const formatted = messages.map(m => ({
            id: m.id,
            role: m.source === 'USER' ? 'USER' : 'AGENT',
            sender: m.source === 'USER' ? 'You' : m.source,
            content: m.body,
            created_at: m.created_at
        }));

        return NextResponse.json({ messages: formatted });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

        // 1. Save User Message
        const { error: saveError } = await supabase.from('inbox_items').insert({
            type: 'CHAT',
            source: 'USER',
            title: 'Chat Message',
            body: message,
            status: 'READ',
            priority: 'P3'
        });
        if (saveError) throw saveError;

        // 2. Generate AI Reply
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SWARM_PROMPT }] },
                { role: "model", parts: [{ text: "System online. Swarm intelligence active. Ready for input." }] }
            ]
        });

        // We could fetch recent context here, but keeping it fast for now.
        const result = await chat.sendMessage(message);
        const replyText = result.response.text();

        // 3. Determine Sender (Simple Heuristic or default to SWARM)
        let sender = "The Swarm";
        if (replyText.includes("Engineer:") || replyText.includes("code")) sender = "The Engineer";
        if (replyText.includes("Boss:") || replyText.includes("strategy")) sender = "The Boss";

        // Remove prefix if AI adds it (e.g. "The Engineer: ...")
        const cleanReply = replyText.replace(/^(The )?(Swarm|Boss|Engineer|Analyst|Custodian|AB-|Deployer):?\s*/i, '');

        // 4. Save AI Reply
        const { error: replyError } = await supabase.from('inbox_items').insert({
            type: 'CHAT',
            source: sender.toUpperCase(),
            title: 'Swarm Reply',
            body: cleanReply,
            status: 'READ',
            priority: 'P3'
        });
        if (replyError) throw replyError;

        return NextResponse.json({ reply: cleanReply, sender });

    } catch (e: any) {
        console.error("Chat API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
