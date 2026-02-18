'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SimulateButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSimulate = async () => {
        setLoading(true);
        try {
            await fetch('/api/simulate', { method: 'POST' });
            router.refresh(); // Refresh Server Components
        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full md:w-auto px-4 py-3 md:py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
        >
            <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>
                {loading ? '↻' : '⚡'}
            </span>
            {loading ? 'INJECTING...' : 'SIMULATE ACTIVITY'}
        </button>
    );
}
