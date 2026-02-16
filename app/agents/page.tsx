
import { db } from "@/src/db";
import { agents } from "@/src/db/schema";
import { AgentGrid } from "@/components/agent-grid";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AgentsPage() {
    try {
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
    } catch (e: any) {
        return (
            <div className="p-8 text-center border border-red-500/20 rounded-xl bg-red-500/5 mt-8">
                <h2 className="text-xl text-red-500 mb-2 font-mono">System Error</h2>
                <p className="text-zinc-300 font-mono text-sm mb-4">{e.message}</p>
                <div className="text-xs text-zinc-500 bg-black/20 p-2 rounded inline-block">
                    Check Vercel Environment Variables (DATABASE_URL)
                </div>
            </div>
        );
    }
}
