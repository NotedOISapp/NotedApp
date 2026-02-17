
import { supabase } from "@/src/db/supabase";
import { InboxList } from "@/components/inbox-list";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InboxPage() {
    try {
        const { data: items, error } = await supabase
            .from('inbox_items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Unified Inbox</h1>
                    <p className="text-zinc-400">Triage signals, ideas, and system alerts.</p>
                </div>
                <InboxList initialItems={items || []} />
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
