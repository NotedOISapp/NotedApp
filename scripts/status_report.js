
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function report() {
    console.log("🔍 Scanning Mission Control Database...\n");

    // 1. Agent Status
    const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('name, status, current_task, last_heartbeat')
        .order('name');

    if (agentError) console.error("Agent Error:", agentError);
    else {
        console.log("🤖 FLEET STATUS:");
        agents.forEach(a => {
            const time = a.last_heartbeat ? new Date(a.last_heartbeat).toLocaleTimeString() : 'Never';
            console.log(`   - ${a.name.padEnd(15)} [${a.status}] Task: ${a.current_task} (Heartbeat: ${time})`);
        });
    }

    // 2. Recent Inbox/Logs
    const { data: logs, error: logError } = await supabase
        .from('inbox_items')
        .select('source, title, body, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (logError) console.error("Log Error:", logError);
    else {
        console.log("\nRecent Activity (Last 10):");
        logs.forEach(l => {
            const time = new Date(l.created_at).toLocaleTimeString();
            console.log(`   [${time}] ${l.source}: ${l.title}`);
        });
    }
}

report();
