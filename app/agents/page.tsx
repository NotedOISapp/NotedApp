
import { db } from "@/src/db";
import { agents } from "@/src/db/schema";
import { AgentGrid } from "@/components/agent-grid";

export const revalidate = 0;

export default async function AgentsPage() {
    const allAgents = await db.select().from(agents).orderBy(agents.name);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Agent Fleet</h1>
                <p className="text-zinc-400">Manage and monitor your autonomous workforce.</p>
            </div>

            <AgentGrid initialAgents={allAgents} />
        </div>
    );
}
