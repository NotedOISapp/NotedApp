import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
});

async function activate() {
    console.log('🚀 Activating Agent Fleet...\n');

    // 1. Set The Boss to RUNNING with current task
    const boss = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Monitoring fleet operations & processing Telegram commands'
        WHERE name = 'The Boss' RETURNING name, status`;
    console.log('✅', boss[0]?.name, '→', boss[0]?.status);

    // 2. Set The Engineer to RUNNING
    const eng = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Implementing Noted App core features (Rich Media, Privacy Blurs)'
        WHERE name = 'The Engineer' RETURNING name, status`;
    console.log('✅', eng[0]?.name, '→', eng[0]?.status);

    // 3. Set The Custodian to RUNNING
    const cust = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Maintaining persistent memory across sessions (Supabase + Markdown)'
        WHERE name = 'The Custodian' RETURNING name, status`;
    console.log('✅', cust[0]?.name, '→', cust[0]?.status);

    // 4. Set The Analyst to RUNNING
    const analyst = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Competitor analysis & ASO strategy research'
        WHERE name = 'The Analyst' RETURNING name, status`;
    console.log('✅', analyst[0]?.name, '→', analyst[0]?.status);

    // 5. Set The AB- to RUNNING
    const ab = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Verifying evidence-before-claims on all agent output'
        WHERE name = 'The AB-' RETURNING name, status`;
    console.log('✅', ab[0]?.name, '→', ab[0]?.status);

    // 6. Set The Deployer to RUNNING
    const dep = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Managing Vercel deployments & Railway service health'
        WHERE name = 'The Deployer' RETURNING name, status`;
    console.log('✅', dep[0]?.name, '→', dep[0]?.status);

    // 7. Activate any remaining agents
    const rest = await sql`
        UPDATE agents SET status = 'RUNNING', current_task = 'Awaiting instructions from The Boss'
        WHERE status != 'RUNNING' RETURNING name, status`;
    if (rest.length > 0) {
        rest.forEach(a => console.log('✅', a.name, '→', a.status));
    }

    // 8. Print final fleet status
    console.log('\n📡 FLEET STATUS:');
    const fleet = await sql`SELECT name, role, status, current_task FROM agents ORDER BY name`;
    fleet.forEach(a => {
        const icon = a.status === 'RUNNING' ? '🟢' : '⚪';
        console.log(`   ${icon} ${a.name} [${a.role}] — ${a.current_task || 'No task'}`);
    });

    console.log(`\n🎯 ${fleet.filter(a => a.status === 'RUNNING').length}/${fleet.length} agents active`);

    await sql.end();
    process.exit(0);
}

activate().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
