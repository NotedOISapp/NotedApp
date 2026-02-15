
import { db } from "@/src/db";
import { bossMemory } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export default async function JournalPage() {
    const memories = await db.select().from(bossMemory).orderBy(desc(bossMemory.createdAt)).limit(50);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mission Journal</h1>
                <p className="text-zinc-400">Persistent memory and decision log from The Boss.</p>
            </div>

            <div className="grid gap-4">
                {memories.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">No memories recorded yet.</div>
                ) : (
                    memories.map((mem) => (
                        <Card key={mem.id} className="p-6 bg-zinc-900/50 border-zinc-800">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs font-mono text-zinc-400">
                                            {mem.category}
                                        </Badge>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(mem.createdAt).toLocaleString()}
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
}
