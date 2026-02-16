import { supabase } from "@/src/db/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JournalPage() {
    try {
        const { data: memories, error } = await supabase
            .from('boss_memory')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw new Error(error.message);

        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mission Journal</h1>
                    <p className="text-zinc-400">Persistent memory and decision log from The Boss.</p>
                </div>

                <div className="grid gap-4">
                    {!memories || memories.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">No memories recorded yet.</div>
                    ) : (
                        memories.map((mem: any) => (
                            <Card key={mem.id} className="p-6 bg-zinc-900/50 border-zinc-800">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs font-mono text-zinc-400">
                                                {mem.category}
                                            </Badge>
                                            <span className="text-xs text-zinc-500">
                                                {mem.created_at ? new Date(mem.created_at).toLocaleString() : 'Just now'}
                                            </span>
                                        </div>
                                        <p className="text-zinc-200 whitespace-pre-wrap">{mem.content}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        );
    } catch (e: any) {
        return (
            <div className="p-8 text-center border border-red-500/20 rounded-xl bg-red-500/5 mt-8">
                <h2 className="text-xl text-red-500 mb-2 font-mono">System Error</h2>
                <p className="text-zinc-300 font-mono text-sm mb-4">{e.message}</p>
            </div>
        );
    }
}
