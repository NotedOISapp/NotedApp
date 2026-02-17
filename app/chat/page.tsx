
import { supabase } from "@/src/db/supabase";
import { ChatInterface } from "@/components/chat-interface";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChatPage() {
    try {
        const { data: agents, error } = await supabase
            .from('agents')
            .select('id, name, role, status')
            .order('name');

        if (error) throw error;

        return <ChatInterface agents={agents || []} />;

    } catch (e: any) {
        return (
            <div className="p-10 text-center text-red-400">
                <h2 className="text-xl mb-2">System Error</h2>
                <p>{e.message}</p>
            </div>
        );
    }
}
