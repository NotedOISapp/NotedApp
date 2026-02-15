import { db } from "./index";
import { agents } from "./schema";

async function main() {
    console.log("🌱 Seeding Agents...");

    const seedAgents = [
        { name: "The Boss", role: "Command & Review", status: "RUNNING" as const },
        { name: "The Engineer", role: "TDD Execution (Superpowers)", status: "IDLE" as const },
        { name: "The Custodian", role: "Memory Persistence (Athena)", status: "IDLE" as const },
        { name: "The Analyst", role: "Research & Intelligence", status: "IDLE" as const },
        { name: "The AB-", role: "Verification Gatekeeper", status: "IDLE" as const },
        { name: "The Deployer", role: "Git & Vercel Pipeline", status: "RUNNING" as const },
    ];

    for (const agent of seedAgents) {
        await db.insert(agents).values({
            name: agent.name,
            role: agent.role,
            status: agent.status,
        }).onConflictDoNothing();
    }

    console.log("✅ Agents Seeded:", seedAgents.map(a => a.name).join(', '));
    process.exit(0);
}

main().catch((err) => {
    console.error("Seed Error:", err);
    process.exit(1);
});
