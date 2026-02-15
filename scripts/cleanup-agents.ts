import { db } from "../src/db";
import { agents } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🧹 Cleaning old agents...");

    // Delete old numbered agents
    await db.delete(agents).where(sql`name LIKE 'Agent %'`);
    await db.delete(agents).where(sql`name = 'Mission Control'`);
    console.log("✅ Old agents removed.");

    // Verify remaining
    const remaining = await db.select().from(agents);
    console.log("📡 Current fleet:");
    remaining.forEach(a => {
        const icon = a.status === 'RUNNING' ? '🟢' : '⚪';
        console.log(`  ${icon} ${a.name} [${a.role}] — ${a.status}`);
    });

    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
