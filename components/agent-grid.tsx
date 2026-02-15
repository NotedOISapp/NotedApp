
import { cn } from "@/lib/utils"

export function AgentGrid({ initialAgents }: { initialAgents: any[] }) {
    const fleet = initialAgents || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleet.map(agent => (
                <div key={agent.id} className="group bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${agent.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' :
                                agent.status === 'ERROR' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                {agent.status === 'RUNNING' ? '⚡' : agent.status === 'ERROR' ? '❌' : '💤'}
                            </div>
                            <div>
                                <div className="font-medium text-slate-200">{agent.name}</div>
                                <div className="text-xs text-slate-500 font-mono">{agent.role}</div>
                            </div>
                        </div>
                        <div className={`text-[10px] font-mono px-2 py-1 rounded border ${agent.status === 'RUNNING' ? 'border-emerald-500/30 text-emerald-400' : 'border-white/5 text-slate-600'
                            }`}>
                            {agent.status}
                        </div>
                    </div>

                    {/* Task specific UI */}
                    <div className="bg-black/20 rounded-lg p-3 min-h-[60px] flex items-center">
                        {agent.status === 'RUNNING' ? (
                            <p className="text-xs text-emerald-300/80 font-mono animate-pulse">
                                ▶ Active
                            </p>
                        ) : (
                            <p className="text-xs text-slate-600 italic">No active instructions.</p>
                        )}
                    </div>
                </div>
            ))}

            {fleet.length === 0 && (
                <div className="col-span-3 text-center py-12 border border-dashed border-white/10 rounded-xl">
                    <p className="text-slate-500">No Agents Found.</p>
                </div>
            )}
        </div>
    )
}
