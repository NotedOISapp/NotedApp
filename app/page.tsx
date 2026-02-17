import { supabase } from "@/src/db/supabase";
import { revalidatePath } from "next/cache";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Fetch Data via Supabase REST API (HTTPS — no PostgreSQL connection needed)
  let fleet: any[] = [];
  let recentInbox: any[] = [];
  let dbError = false;

  try {
    const { data: agentsData, error: agentsErr } = await supabase
      .from('agents')
      .select('*')
      .order('name');
    if (agentsErr) throw agentsErr;
    fleet = agentsData || [];

    const { data: inboxData, error: inboxErr } = await supabase
      .from('inbox_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (inboxErr) throw inboxErr;
    recentInbox = inboxData || [];
  } catch (e) {
    console.error("DB Query Error:", e);
    dbError = true;
  }

  // 3. Fetch Cost Data
  let totalCost = 0.00;
  try {
    const { data: runsData } = await supabase.from('runs').select('cost_cents');
    if (runsData) {
      totalCost = runsData.reduce((acc, r) => acc + (r.cost_cents || 0), 0) / 100;
    }
  } catch (e) {
    console.error("Cost Query Error", e);
  }

  // 4. Metrics
  const activeAgents = fleet.filter(a => a.status === 'RUNNING').length;
  const errorAgents = fleet.filter(a => a.status === 'ERROR').length;

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight">Mission Control</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1 font-mono">
            R.E.A.C.T. System • Vercel Region: iad1 • DB: Supabase
          </p>
        </div>
        <form action={async () => {
          'use server';
          revalidatePath('/');
        }}>
          <button className="w-full md:w-auto px-4 py-3 md:py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ONLINE (Refresh)
          </button>
        </form>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-4 md:p-6 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">Fleet Status</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl md:text-4xl font-light text-white">{activeAgents}</div>
            <div className="text-[10px] md:text-sm text-slate-500">/ {fleet.length} Active</div>
          </div>
          {errorAgents > 0 && <div className="text-[10px] text-red-400 mt-2">⚠️ {errorAgents} Errors</div>}
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-4 md:p-6 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">Inbox Queue</div>
          <div className="text-2xl md:text-4xl font-light text-white">{recentInbox.length}</div>
          <div className="text-[10px] md:text-xs text-blue-400 mt-2">Recent Items</div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-4 md:p-6 rounded-2xl relative overflow-hidden">
          <div className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">Database</div>
          <div className={`text-2xl md:text-4xl font-light ${dbError ? 'text-red-400' : 'text-emerald-400'}`}>{dbError ? 'ERR' : 'CONN'}</div>
          <div className="text-[10px] md:text-xs text-slate-500 mt-2">{dbError ? 'Failed' : 'Write Active'}</div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-4 md:p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
          <div className="text-slate-500 text-[10px] md:text-xs uppercase tracking-widest mb-1 flex justify-between">
            <span>Cost (Net)</span>
            <span className="text-emerald-500 font-bold">HEADROOM ACTIVE</span>
          </div>
          <div className="text-2xl md:text-4xl font-light text-white">${totalCost.toFixed(2)}</div>
          <div className="text-[10px] md:text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <span className="bg-emerald-500/10 px-1 py-0.5 rounded">⬇ 90%</span>
            <span>Saved ${(totalCost * 9).toFixed(2)} (est)</span>
          </div>
          {/* Headroom / Agent 15 Visual */}
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Agent Grid */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
            🤖 Active Agents
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-400">{fleet.length}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fleet.map(agent => (
              <Link href={`/agents?focus=${encodeURIComponent(agent.name)}`} key={agent.id} className="block group bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all p-5 rounded-xl hover:bg-white/5 active:scale-[0.98] duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${agent.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400' :
                      agent.status === 'ERROR' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                      {agent.status === 'RUNNING' ? '⚡' : agent.status === 'ERROR' ? '❌' : '💤'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{agent.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{agent.role}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] font-mono px-2 py-1 rounded border ${agent.status === 'RUNNING' ? 'border-emerald-500/30 text-emerald-400' : 'border-white/5 text-slate-600'
                    }`}>
                    {agent.status}
                  </div>
                </div>

                {/* Task specific UI */}
                <div className="bg-black/20 rounded-lg p-3 min-h-[60px] flex items-center group-hover:bg-black/40 transition-colors">
                  {agent.status === 'RUNNING' ? (
                    <p className="text-xs text-emerald-300/80 font-mono animate-pulse">
                      ▶ {agent.current_task || 'Awaiting orders...'}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">No active instructions.</p>
                  )}
                </div>
              </Link>
            ))}

            {fleet.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-white/10 rounded-xl">
                <p className="text-slate-500">No Agents Found.</p>
                <p className="text-xs text-slate-700 mt-2">Run `npm run seed` to populate fleet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Inbox Feed */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg font-medium text-slate-200">📨 Signal Intake</h3>
          <div className="bg-slate-900/40 border border-white/5 rounded-xl divide-y divide-white/5">
            {recentInbox.length === 0 ? (
              <div className="p-8 text-center text-slate-600 text-sm">Inbox Empty</div>
            ) : (
              recentInbox.map(item => (
                <div key={item.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-xs text-slate-600">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{item.body || item.title}</p>
                </div>
              ))
            )}

            <div className="p-3 text-center border-t border-white/5">
              <button className="text-xs text-slate-500 hover:text-white transition-colors">View All Signals →</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
