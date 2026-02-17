
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type AgentDetailProps = {
    agent: any;
    tasks: any[];
    runs: any[];
};

export function AgentDetail({ agent, tasks, runs }: AgentDetailProps) {
    const queue = tasks.filter(t => t.status === 'PENDING');
    const activeTask = tasks.find(t => t.status === 'IN_PROGRESS');
    const completed = runs.filter(r => r.status === 'COMPLETED' || r.status === 'SUCCESS');

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/agents" className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${agent.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' :
                        agent.status === 'ERROR' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                        {agent.status === 'RUNNING' ? '⚡' : agent.status === 'ERROR' ? '❌' : '💤'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
                        <p className="text-slate-400 font-mono">{agent.role}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-mono border ${agent.status === 'RUNNING' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-slate-500'
                    }`}>
                    STATUS: {agent.status}
                </div>
            </div>

            {/* Current Mission */}
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                <h2 className="text-xs uppercase tracking-widest text-emerald-500 mb-2">Current Mission</h2>
                <div className="text-xl text-slate-200 font-light">
                    {agent.current_task || activeTask?.title || "Standing by for orders..."}
                </div>
                {agent.status === 'RUNNING' && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/80 font-mono">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Processing...
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Queue */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center justify-between">
                        <span>📋 Task Queue</span>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-400">{queue.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {queue.length === 0 ? (
                            <p className="text-sm text-slate-600 italic">Queue empty.</p>
                        ) : (
                            queue.map(task => (
                                <div key={task.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-sm text-slate-300">{task.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">PENDING</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-200 mb-4">📜 Recent Activity</h3>
                    <div className="space-y-4">
                        {runs.length === 0 ? (
                            <p className="text-sm text-slate-600 italic">No recent activity logs.</p>
                        ) : (
                            runs.slice(0, 5).map(run => (
                                <div key={run.id} className="border-l-2 border-white/10 pl-4 py-1">
                                    <div className="text-xs text-slate-500 mb-0.5">
                                        {run.ended_at ? formatDistanceToNow(new Date(run.ended_at), { addSuffix: true }) : 'Recently'}
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        {run.status === 'COMPLETED' ? 'Completed task successfully.' : `Status: ${run.status}`}
                                    </div>
                                    {run.cost_cents > 0 && (
                                        <div className="text-[10px] text-emerald-500 mt-1 font-mono">
                                            Usage: ${(run.cost_cents / 100).toFixed(4)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
