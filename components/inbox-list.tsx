'use client';

import { useState } from 'react';
import { supabase } from "@/src/db/supabase";
import { formatDistanceToNow } from 'date-fns';

type InboxItem = {
    id: string;
    type: string;
    source: string;
    title: string;
    body: string;
    status: string;
    created_at: string;
    priority: string;
};

export function InboxList({ initialItems }: { initialItems: InboxItem[] }) {
    const [items, setItems] = useState<InboxItem[]>(initialItems);
    const [filter, setFilter] = useState<'ALL' | 'IDEA' | 'ALERT' | 'CHAT'>('ALL');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const filteredItems = filter === 'ALL'
        ? items
        : items.filter(i => i.type === filter);

    async function handleAction(id: string, action: 'ARCHIVE' | 'APPROVE') {
        setLoadingId(id);
        try {
            if (action === 'ARCHIVE') {
                const { error } = await supabase
                    .from('inbox_items')
                    .update({ status: 'ARCHIVED' })
                    .eq('id', id);
                if (error) throw error;
                setItems(prev => prev.filter(i => i.id !== id));
            } else if (action === 'APPROVE') {
                // For now, just mark as ACTIONED. Later, create a Task.
                const { error } = await supabase
                    .from('inbox_items')
                    .update({ status: 'ACTIONED' })
                    .eq('id', id);
                if (error) throw error;

                // Ideally trigger a task creation here (omitted for MVP)
                setItems(prev => prev.filter(i => i.id !== id));
            }
        } catch (e) {
            console.error("Action failed", e);
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-1">
                {['ALL', 'IDEA', 'ALERT', 'CHAT'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${filter === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase() + 's'}
                        {filter === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 border border-dashed border-white/5 rounded-xl">
                        No items found in {filter.toLowerCase()} view.
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${item.type === 'IDEA' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            item.type === 'ALERT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                item.type === 'CHAT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-slate-800 text-slate-400 border-white/5'
                                        }`}>
                                        {item.type}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        via {item.source} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <h3 className="text-base text-slate-200 font-medium mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2">{item.body}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleAction(item.id, 'APPROVE')}
                                    disabled={loadingId === item.id}
                                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 transition-colors disabled:opacity-50"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(item.id, 'ARCHIVE')}
                                    disabled={loadingId === item.id}
                                    className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-medium rounded-lg border border-white/5 transition-colors disabled:opacity-50"
                                >
                                    Archive
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
