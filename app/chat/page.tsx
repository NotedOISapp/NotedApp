'use client';

import { useState, useEffect, useRef } from 'react';

type Message = {
    id: string;
    role: 'USER' | 'AGENT';
    sender: string;
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        fetchMessages();
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function fetchMessages() {
        try {
            const res = await fetch('/api/chat');
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.created_at)
                })));
            }
        } catch (e) {
            console.error("Failed to fetch messages", e);
        }
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim()) return;

        const tempId = Date.now().toString();
        const newMsg: Message = {
            id: tempId,
            role: 'USER',
            sender: 'You',
            content: input,
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMsg.content })
            });
            const data = await res.json();

            if (data.reply) {
                const replyMsg: Message = {
                    id: Date.now().toString() + 'r',
                    role: 'AGENT',
                    sender: data.sender || 'The Swarm',
                    content: data.reply,
                    timestamp: new Date()
                };
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' as const } : m).concat(replyMsg));
            }
        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' as const } : m));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div>
                    <h2 className="text-xl font-light text-white">Swarm Uplink</h2>
                    <p className="text-xs text-slate-500 font-mono">Direct Neural Interface • All Agents Listening</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
                </div>
            </div>

            {/* Message List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 scroll-smooth">
                {messages.length === 0 && (
                    <div className="text-center text-slate-600 py-10 text-sm italic">
                        No active transmission. Channel open.
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'USER'
                            ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm'
                            : 'bg-slate-800/80 border border-white/10 text-slate-200 rounded-tl-sm'
                            }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${msg.role === 'USER' ? 'text-blue-400' : 'text-emerald-400'
                                    }`}>
                                    {msg.sender}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                            </div>
                            {msg.status === 'error' && <div className="text-[10px] text-red-400 mt-1">Failed to send</div>}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Broadcast message to swarm..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ➤
                </button>
            </form>
        </div>
    );
}
