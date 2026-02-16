import './globals.css';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col md:flex-row h-screen bg-[#0A0A0F] text-slate-200 overflow-hidden font-sans">
          {/* Sidebar (Desktop Only) */}
          <aside className="hidden md:flex w-64 glass-sidebar flex-col justify-between p-4 z-50 bg-black/40 border-r border-white/10 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                  <span className="text-blue-400 font-bold">MC</span>
                </div>
                <h1 className="text-lg font-bold tracking-wider text-slate-100">NOTED<span className="text-slate-500 font-normal">.SWARM</span></h1>
              </div>

              <nav className="space-y-1">
                <NavItem href="/" label="Dashboard" icon="⚡" />
                <NavItem href="/chat" label="Swarm Chat" icon="💬" />
                <NavItem href="/hub" label="The Hub" icon="📡" />
                <NavItem href="/journal" label="Journal" icon="📔" />
                <NavItem href="/agents" label="Agents" icon="🤖" />
                <NavItem href="/workshop" label="Workshop" icon="🔨" />
              </nav>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Swarm Load</div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[42%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ONLINE
                </span>
                <span>v0.1.0</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.2)_0%,_rgba(10,10,15,0)_50%)] pointer-events-none"></div>
            <div className="p-4 md:p-8 relative z-10">
              {children}
            </div>
          </main>

          {/* Bottom Nav (Mobile Only) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-50 px-2 safe-area-bottom">
            <MobileNavItem href="/" label="Home" icon="⚡" />
            <MobileNavItem href="/chat" label="Chat" icon="💬" />
            <MobileNavItem href="/agents" label="Agents" icon="🤖" />
            <MobileNavItem href="/journal" label="Journal" icon="📔" />
            <MobileNavItem href="/settings" label="Settings" icon="⚙️" />
          </nav>
        </div>
      </body>
    </html>
  );
}

function NavItem({ href, label, icon, active }: { href: string, label: string, icon: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${active ? 'bg-white/10 text-white border border-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
      <span className="text-lg opacity-80">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function MobileNavItem({ href, label, icon }: { href: string, label: string, icon: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-white transition-colors active:scale-95 duration-200">
      <span className="text-xl mb-0.5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
