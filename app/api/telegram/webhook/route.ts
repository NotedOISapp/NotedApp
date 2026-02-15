import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || '').trim();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '');
const MODELS_TO_TRY = ["gemini-2.5-flash", "models/gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];

const SYSTEM_PROMPT = `You are Mission Control, the AI interface for the **Noted App Swarm**. 
You are speaking to the Commander (User).
**MISSION PARAMETERS:**
1. Focus EXCLUSIVELY on the "Noted" App (Private journaling, local-first, privacy-centric).
2. Do NOT discuss "BizScan", "Access Forensics", or other projects. If asked, politely redirect to Noted.
3. Keep responses concise, professional, and slightly futuristic (sci-fi coded).
4. If the user gives a command, confirm it and say 'Logged for execution.'.
5. Do not ask follow-up questions unless critical. Be decisive.`;

export async function POST(request: Request) {
    if (!TELEGRAM_TOKEN || !GOOGLE_API_KEY) {
        console.error("Missing tokens: TELEGRAM_BOT_TOKEN or GOOGLE_API_KEY");
        return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
    }

    const body = await request.json();

    if (body.message && body.message.text) {
        const text = body.message.text;
        const chatId = body.message.chat.id;

        // 1. Generate AI Response with Fallback
        let responseText = "";
        let errorLog = "";

        for (const modelName of MODELS_TO_TRY) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: "System Init." }] },
                        { role: "model", parts: [{ text: "Online." }] },
                    ],
                    systemInstruction: SYSTEM_PROMPT
                });
                const result = await chat.sendMessage(text);
                responseText = result.response.text();
                break; // Success!
            } catch (e: any) {
                console.error(`Model ${modelName} failed:`, e.message);
                errorLog += `[${modelName}]: ${e.message.substring(0, 50)}... \n`;
            }
        }

        // 2. Send back to Telegram
        if (responseText) {
            await sendTelegramReply(chatId, responseText);
        } else {
            // Send DEBUG info to user
            await sendTelegramReply(chatId, `⚠️ ALL MODELS FAILED.\n\nDebug Log:\n${errorLog}`);
        }
    }

    return NextResponse.json({ output: 'ok' });
}

async function sendTelegramReply(chatId: number, text: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text })
        });
    } catch (e) {
        console.error("Telegram Send Error:", e);
    }
}
