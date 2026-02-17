import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/src/db/supabase";
import { smartCrusher, Message } from "@/lib/headroom";

export const maxDuration = 60;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || "");

const PERSONAS: Record<string, string> = {
    'THE BOSS': "You are **The Boss**. Strategic, commanding. Focus on fleet coordination and high-level goals.",
    'THE ENGINEER': "You are **The Engineer**. Technical, precise. Focus on code, architecture, and Vercel/Next.js details.",
    'THE AB-': "You are **The AB-**. Critical, truth-seeking. Verify claims, detect hallucinations, ensure rigorous adherence to Canon.",
    'THE ANALYST': "You are **The Analyst**. Market-aware, data-driven. Focus on competitors, App Store trends, and user metrics.",
    'THE CUSTODIAN': "You are **The Custodian**. Archival, protective. Focus on memory retention, database integrity, and privacy.",
    'THE DEPLOYER': "You are **The Deployer**. Operational, efficient. Focus on CI/CD pipelines, Vercel deployments, and git status.",
    'THE SWARM': "You are **The Swarm** — the collective intelligence. Synthesize perspectives from all agents."
};

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

        // 1. Tag Routing
        let targetAgent = 'THE SWARM';
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('@boss') || lowerMsg.includes('@gov')) targetAgent = 'THE BOSS';
        else if (lowerMsg.includes('@engineer') || lowerMsg.includes('@dev')) targetAgent = 'THE ENGINEER';
        else if (lowerMsg.includes('@ab') || lowerMsg.includes('@verify')) targetAgent = 'THE AB-';
        else if (lowerMsg.includes('@analyst')) targetAgent = 'THE ANALYST';
        else if (lowerMsg.includes('@custodian')) targetAgent = 'THE CUSTODIAN';
        else if (lowerMsg.includes('@deployer')) targetAgent = 'THE DEPLOYER';

        // 2. Save User Message
        const { error: saveError } = await supabase.from('inbox_items').insert({
            type: 'CHAT',
            source: 'USER',
            title: `Message to ${targetAgent}`,
            body: message,
            status: 'READ',
            priority: 'P3'
        });
        if (saveError) throw saveError;

        // 3. Fetch History for Context
        const { data: historyData } = await supabase
            .from('inbox_items')
            .select('*')
            .eq('type', 'CHAT')
            .order('created_at', { ascending: true }) // Oldest first
            .limit(20);

        const history: Message[] = (historyData || []).map(m => ({
            role: m.source === 'USER' ? 'user' : 'model',
            content: m.body || '', // Handle null body
            name: m.source
        }));

        // 4. Headroom Compression (SmartCrusher)
        const { messages: compressedHistory, stats } = smartCrusher.compress(history);

        // Log Savings (Simulated "Paper Trail")
        if (stats.savings_percent > 0) {
            console.log(`[Headroom] Compressed ${stats.original_chars} -> ${stats.compressed_chars} chars. Savings: ${stats.savings_percent}%`);
            await supabase.from('runs').insert({
                status: 'COMPLETED',
                task_id: null, // Chat has no task ID yet
                agent_id: null,
                started_at: new Date(),
                ended_at: new Date(),
                cost_cents: 0, // Gemini Flash is free/cheap, but we could track "saved" cost
            });
            // We'll just log to Boss Memory for visibility
            await supabase.from('boss_memory').insert({
                category: 'HEADROOM',
                content: `Compressed chat context by ${stats.savings_percent}%. Saved ${stats.original_chars - stats.compressed_chars} chars.`
            });
        }

        // 5. Generate AI Reply
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemInstruction = PERSONAS[targetAgent] || PERSONAS['THE SWARM'];

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemInstruction }] },
                { role: "model", parts: [{ text: `Acknowledged. I am ${targetAgent}. Waiting for input.` }] },
                // Inject compressed history if needed, but Gemini manages its own history in startChat usually. 
                // For stateless REST APIs we'd pass it all. 
                // Here "history" is for *previous* turns. 
                // We'll assume the chat session is ephemeral per request for this MVP route.
                // To properly use compressed history, we should convert it to Gemini format Parts.
                ...compressedHistory.filter(m => m.content).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ]
        });

        const result = await chat.sendMessage(message);
        const replyText = result.response.text();

        // Clean prefix
        const cleanReply = replyText.replace(/^(The )?(Swarm|Boss|Engineer|Analyst|Custodian|AB-|Deployer)(\s*:)?\s*/i, '');

        // 6. Save AI Reply
        const { error: replyError } = await supabase.from('inbox_items').insert({
            type: 'CHAT',
            source: targetAgent,
            title: `${targetAgent} Reply`,
            body: cleanReply,
            status: 'READ',
            priority: 'P3'
        });
        if (replyError) throw replyError;

        return NextResponse.json({ reply: cleanReply, sender: targetAgent, stats });

    } catch (e: any) {
        console.error("Chat API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
