
export const dynamic = 'force-dynamic';

export default function StatusPage() {
    // Hardcoded from task.md state for MVP
    // In V2, this could pull from a 'milestones' table
    const phases = [
        {
            id: 1,
            name: "Phase 1: The Foundation",
            status: "COMPLETED",
            progress: 100,
            items: ["Governance & Canon", "UX Flows", "Local Schema", "Privacy Spec"],
            color: "emerald"
        },
        {
            id: 2,
            name: "Phase 2: Core Build",
            status: "IN_PROGRESS",
            progress: 60,
            items: ["App Structure", "Privacy Blurs", "SQLite Locking", "Rich Media"],
            color: "amber"
        },
        {
            id: 3,
            name: "Phase 3: Paid Features",
            status: "PENDING",
            progress: 0,
            items: ["E2EE Spec", "Single-Shot AI", "Billing Integration"],
            color: "slate"
        },
        {
            id: 4,
            name: "Phase 4: Release Gate",
            status: "PENDING",
            progress: 0,
            items: ["Privacy Audit", "Offline Verification", "ASO Strategy"],
            color: "slate"
        },
        {
            id: 5,
            name: "Phase 5: Mission Control",
            status: "COMPLETED",
            progress: 95,
            items: ["Dashboard UI", "Agent Grid", "Swarm Chat", "Unified Inbox", "DevOps"],
            color: "emerald"
        }
    ];

    const overallProgress = Math.round(phases.reduce((acc, p) => acc + p.progress, 0) / phases.length);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Project Status</h1>
                <p className="text-zinc-400">High-level roadmap and completion tracking.</p>
            </div>

            {/* Overall Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Overall Progress</div>
                    <div className="text-4xl font-light text-white">{overallProgress}%</div>
                    <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">Current Focus</div>
                    <div className="text-2xl font-light text-amber-400">Phase 2: Core Build</div>
                    <div className="text-xs text-slate-500 mt-2">Mobile App Feature Parity</div>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <div className="text-slate-500 text-xs uppercase tracking-widest mb-1">System Health</div>
                    <div className="text-2xl font-light text-emerald-400">OPERATIONAL</div>
                    <div className="text-xs text-slate-500 mt-2">All Agents Online</div>
                </div>
            </div>

            {/* Phase Timeline */}
            <div className="space-y-4">
                <h2 className="text-xl font-medium text-slate-200">Roadmap Timeline</h2>
                <div className="space-y-4">
                    {phases.map(phase => (
                        <div key={phase.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${phase.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    phase.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-slate-800 text-slate-500 border border-white/5'
                                }`}>
                                {phase.id}
                            </div>

                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className={`text-lg font-medium ${phase.status === 'PENDING' ? 'text-slate-500' : 'text-slate-200'
                                        }`}>{phase.name}</h3>
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${phase.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                            phase.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-slate-800 text-slate-500'
                                        }`}>
                                        {phase.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${phase.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                phase.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                                    'bg-slate-700'
                                            }`}
                                        style={{ width: `${phase.progress}%` }}
                                    />
                                </div>

                                {/* Items */}
                                <div className="flex flex-wrap gap-2">
                                    {phase.items.map((item, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
