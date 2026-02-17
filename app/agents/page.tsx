import { supabase } from "@/src/db/supabase";
import { AgentGrid } from "@/components/agent-grid";
import { AgentDetail } from "@/components/agent-detail";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AgentsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const focusAgentName = searchParams?.focus as string | undefined;

    try {
        // 1. Fetch All Agents (for Grid)
        const { data: allAgents, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .order('name');

        if (agentsError) throw agentsError;

        // 2. If Focus, Fetch Details
        if (focusAgentName) {
            const agent = allAgents?.find(a => a.name === focusAgentName);

            if (agent) {
                // Fetch Tasks
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('agent_id', agent.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Fetch Runs
                const { data: runs } = await supabase
                    .from('runs')
                    .select('*')
                    .eq('agent_id', agent.id)
                    .order('ended_at', { ascending: false })
                    .limit(20);

                return <AgentDetail agent={agent} tasks={tasks || []} runs={runs || []} />;
            }
        }

        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Agent Fleet</h1>
                    <p className="text-zinc-400">Manage and monitor your autonomous workforce.</p>
                </div>
                <AgentGrid initialAgents={allAgents || []} />
            </div>
        );
    } catch (e: any) {
        return (
            <div className="p-8 text-center border border-red-500/20 rounded-xl bg-red-500/5 mt-8">
                <h2 className="text-xl text-red-500 mb-2 font-mono">System Error</h2>
                <p className="text-zinc-300 font-mono text-sm mb-4">{e.message}</p>
            </div>
        );
    }
}
