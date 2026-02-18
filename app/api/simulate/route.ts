
import { NextResponse } from 'next/server';
import { supabase } from "@/src/db/supabase";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log("🎭 Simulating Activity...");

        // 1. Random Inbox Item
        const inboxSources = ['TELEGRAM', 'VERCEL', 'APP_STORE', 'SYSTEM'];
        const inboxTitles = [
            'User Feedback: Love the dark mode w/o pure black',
            'Alert: Headroom compression saved 15k tokens',
            'Deploy Success: Commit 8f2a9c',
            'Crash Report: iOS 17.0.1 on iPhone 12',
            'Idea: "Zen Mode" with no UI for 5 mins'
        ];

        const randomSource = inboxSources[Math.floor(Math.random() * inboxSources.length)];
        const randomTitle = inboxTitles[Math.floor(Math.random() * inboxTitles.length)];

        await supabase.from('inbox_items').insert({
            type: randomSource === 'SYSTEM' ? 'ALERT' : 'IDEA',
            source: randomSource,
            title: randomTitle,
            body: `Simulated event at ${new Date().toLocaleTimeString()}`,
            status: 'NEW',
            priority: 'P2'
        });

        // 2. Update Random Agent
        const { data: agents } = await supabase.from('agents').select('name');
        if (agents && agents.length > 0) {
            const randomAgent = agents[Math.floor(Math.random() * agents.length)];
            const tasks = [
                'Analyzing user retention metrics',
                'Optimizing database queries',
                'Reviewing PR #42',
                'Compressing chat history',
                'Scanning for pattern anomalies',
                'Deploying hotfix to Vercel'
            ];
            const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

            await supabase.from('agents').update({
                current_task: randomTask,
                status: 'RUNNING',
                updated_at: new Date()
            }).eq('name', randomAgent.name);
        }

        return NextResponse.json({ success: true, message: "Activity Simulated" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
