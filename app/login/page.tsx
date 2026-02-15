'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ pin }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
            router.push('/dashboard');
        } else {
            setError('ACCESS DENIED');
            setPin('');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-white">
            <div className="w-full max-w-sm p-8 glass-card rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5 relative overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 animate-pulse">
                        <span className="text-2xl">🔒</span>
                    </div>

                    <h1 className="text-xl font-light tracking-[0.2em] mb-2 font-mono">RESTRICTED_ACCESS</h1>
                    <p className="text-xs text-slate-500 mb-8 uppercase tracking-widest">Noted Mission Control</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="ENTER PASSWORD"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-center tracking-widest focus:outline-none focus:border-blue-500/50 text-emerald-400 font-mono placeholder:tracking-normal placeholder:text-slate-700 transition-all"
                            autoFocus
                        />

                        {error && <div className="text-red-500 text-xs font-mono tracking-widest animate-bounce">{error}</div>}

                        <button
                            type="submit"
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg uppercase text-xs tracking-widest transition-all hover:border-white/20"
                        >
                            Authenticate
                        </button>
                    </form>
                </div>
            </div>
            <div className="mt-8 text-xs text-slate-700 font-mono">SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>
    );
}
