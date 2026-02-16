import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
});

async function cleanup() {
    console.log('🧹 Cleaning duplicate agents...\n');

    // For UUID ids, use a subquery with DISTINCT ON
    const dupes = await sql`
        DELETE FROM agents
        WHERE id NOT IN (
            SELECT DISTINCT ON (name) id FROM agents ORDER BY name, id
        )
        RETURNING name`;

    console.log(`🗑️ Removed ${dupes.length} duplicates:`, dupes.map(d => d.name).join(', '));

    // Show final clean fleet
    const fleet = await sql`SELECT id, name, role, status, current_task FROM agents ORDER BY name`;
    console.log(`\n📡 CLEAN FLEET (${fleet.length} agents):`);
    fleet.forEach(a => {
        console.log(`   🟢 ${a.name} [${a.role}] — ${a.current_task || 'No task'}`);
    });

    await sql.end();
    process.exit(0);
}

cleanup().catch(e => { console.error('❌', e.message); process.exit(1); });
