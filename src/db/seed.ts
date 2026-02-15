import { db } from "./index";
import { agents } from "./schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
    console.log("🌱 Seeding Agents...");

    const seedAgents = [
        { name: "Agent 0", role: "Governance", status: "IDLE" },
        { name: "Agent 1", role: "Database", status: "IDLE" },
        { name: "Agent 2", role: "Frontend", status: "RUNNING" },
        { name: "Agent 3", role: "Design", status: "IDLE" },
        { name: "Agent 4", role: "QA", status: "ERROR" },
        { name: "Mission Control", role: "Orchestrator", status: "RUNNING" },
    ];

    for (const agent of seedAgents) {
        await db.insert(agents).values({
            name: agent.name,
            role: agent.role,
            status: agent.status as any,
        }).onConflictDoNothing();
    }

    console.log("✅ Agents Seeded.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seed Error:", err);
    process.exit(1);
});
