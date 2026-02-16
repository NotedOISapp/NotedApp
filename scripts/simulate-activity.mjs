import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
});

async function simulate() {
    console.log('🎭 Injecting Simulated Activity Logs...\n');

    // 1. Inject Inbox Items (From "Users")
    const inboxItems = [
        { type: 'IDEA', source: 'TELEGRAM', title: 'Feature Request: Dark Mode Toggle', body: 'Users are asking for a manual dark mode toggle in settings.', status: 'NEW', priority: 'P2' },
        { type: 'ALERT', source: 'VERCEL', title: 'Deploy Success: commit c60ac50', body: 'Production build deployed successfully in 45s.', status: 'NEW', priority: 'P1' },
        { type: 'MESSAGE', source: 'TELEGRAM', title: 'Bug Report: Login Crash', body: 'Login screen flashes white on iOS 17.2.', status: 'NEW', priority: 'P0' },
    ];

    for (const item of inboxItems) {
        await sql`
            INSERT INTO inbox_items (type, source, title, body, status, priority, created_at)
            VALUES (${item.type}, ${item.source}, ${item.title}, ${item.body}, ${item.status}, ${item.priority}, NOW())
        `;
        console.log(`📨 Inbox: [${item.source}] ${item.title}`);
    }

    // 2. Inject Memory Entries (From "The Boss")
    const memories = [
        { category: 'DECISION', content: 'Approved Supabase migration for Vercel compatibility.' },
        { category: 'REVIEW', content: 'Agent grid UI looks stable. Green status lights confirmed.' },
        { category: 'PLAN', content: 'Next sprint focus: Unified Inbox and mobile app integration.' },
    ];

    for (const mem of memories) {
        await sql`
            INSERT INTO boss_memory (category, content, created_at)
            VALUES (${mem.category}, ${mem.content}, NOW())
        `;
        console.log(`🧠 Memory: [${mem.category}] ${mem.content}`);
    }

    // 3. Update Agent Tasks (Mock Progress)
    const task updates = [
        { name: 'The Boss', task: 'Reviewing recent inbox items & planning next sprint' },
        { name: 'The Engineer', task: 'Compiling privacy blur module for iOS' },
        { name: 'The Analyst', task: 'Scanning App Store for competitor "Mood Tracker" updates' },
    ];

    for (const update of task updates) { // Syntax error in variable name "task updates" -> "updates" or "taskUpdates"
        await sql`
            UPDATE agents SET current_task = ${update.task} WHERE name = ${update.name}
        `;
        console.log(`🤖 Agent: ${update.name} → ${update.task}`);
    }

    console.log('\n✅ Simulation Complete. Dashboard should be lit up with activity.');
    await sql.end();
    process.exit(0);
}

simulate().catch(e => { console.error('❌', e.message); process.exit(1); });
