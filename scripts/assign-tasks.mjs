import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
});

async function assignTasks() {
    console.log('📋 Assigning REAL tasks from task.md...\n');

    // 1. The Engineer -> Build Unified Inbox UI
    const eng = await sql`
        UPDATE agents 
        SET status = 'RUNNING', 
            current_task = 'Building Unified Inbox UI (Agent 4 Directive) - app/inbox/page.tsx',
            last_heartbeat = NOW()
        WHERE name = 'The Engineer' RETURNING name, current_task`;
    console.log('👷', eng[0]?.name, '→', eng[0]?.current_task);

    // 2. The Deployer -> Research Vercel API
    const dep = await sql`
        UPDATE agents 
        SET status = 'RUNNING', 
            current_task = 'Researching Vercel API for Deploy Pipeline View (Agent 5 Directive)',
            last_heartbeat = NOW()
        WHERE name = 'The Deployer' RETURNING name, current_task`;
    console.log('🚀', dep[0]?.name, '→', dep[0]?.current_task);

    // 3. The Analyst -> Competitor Scan
    const analyst = await sql`
        UPDATE agents 
        SET status = 'RUNNING', 
            current_task = 'Ongoing: Monitoring App Store for privacy-focused journal apps',
            last_heartbeat = NOW()
        WHERE name = 'The Analyst' RETURNING name, current_task`;
    console.log('🕵️', analyst[0]?.name, '→', analyst[0]?.current_task);

    // 4. The Boss -> Coordination
    const boss = await sql`
        UPDATE agents 
        SET status = 'RUNNING', 
            current_task = 'Overseeing Phase 5 construction: Inbox & Deploy Views',
            last_heartbeat = NOW()
        WHERE name = 'The Boss' RETURNING name, current_task`;
    console.log('👑', boss[0]?.name, '→', boss[0]?.current_task);

    // Log the assignment to memory
    await sql`
        INSERT INTO boss_memory (category, content, created_at)
        VALUES ('DECISION', 'Assigned "Unified Inbox" to The Engineer and "Deploy View" to The Deployer.', NOW())
    `;

    console.log('\n✅ Tasks Assigned. Dashboard updated.');
    await sql.end();
    process.exit(0);
}

assignTasks().catch(e => { console.error('❌', e.message); process.exit(1); });
