'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export function DeploymentQR() {
    const [info, setInfo] = useState<any>(null);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setUrl(window.location.origin);
        fetch('/deployment.json')
            .then(res => res.json())
            .then(setInfo)
            .catch(e => console.log("No deployment info"));
    }, []);

    if (!url) return null;

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-3 rounded-xl shadow-lg shadow-white/5">
                <QRCode value={url} size={80} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-medium text-white mb-1">Mission Control Mobile</h3>
                <p className="text-xs text-slate-400 mb-4">Scan to monitor the swarm on your device.</p>

                {info && (
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5 inline-block md:block text-left w-full">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Latest Deploy</span>
                            <span className="text-[10px] text-slate-500 font-mono">{info.timestamp ? new Date(info.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div className="text-sm text-slate-200 line-clamp-2">{info.summary}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
