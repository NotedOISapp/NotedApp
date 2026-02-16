import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL;

    // Mask the URL for safety but show enough to diagnose
    let maskedUrl = 'NOT SET';
    let urlLength = 0;
    let hasExclamation = false;
    let port = 'unknown';
    let host = 'unknown';

    if (dbUrl) {
        urlLength = dbUrl.length;
        hasExclamation = dbUrl.includes('!');
        // Extract host and port safely
        try {
            const match = dbUrl.match(/@([^:]+):(\d+)\//);
            if (match) {
                host = match[1];
                port = match[2];
            }
        } catch { }
        maskedUrl = dbUrl.substring(0, 20) + '***' + dbUrl.substring(dbUrl.length - 30);
    }

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL_exists: !!dbUrl,
            DATABASE_URL_length: urlLength,
            DATABASE_URL_masked: maskedUrl,
            DATABASE_URL_has_exclamation: hasExclamation,
            DATABASE_URL_host: host,
            DATABASE_URL_port: port,
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
        },
        connection_test: 'not attempted',
    };

    if (!dbUrl) {
        diagnostics.connection_test = 'SKIPPED — no DATABASE_URL';
        return NextResponse.json(diagnostics, { status: 500 });
    }

    // Try connecting
    const sql = postgres(dbUrl, {
        ssl: { rejectUnauthorized: false },
        prepare: false,
        connect_timeout: 10,
    });

    try {
        const result = await sql`SELECT 1 as test`;
        diagnostics.connection_test = 'SUCCESS';
        diagnostics.basic_query = result;

        // Try reading agents
        try {
            const agents = await sql`SELECT count(*) as cnt FROM agents`;
            diagnostics.agents_count = agents[0].cnt;
        } catch (e: any) {
            diagnostics.agents_error = e.message;
        }

        // Try reading boss_memory
        try {
            const mem = await sql`SELECT count(*) as cnt FROM boss_memory`;
            diagnostics.memory_count = mem[0].cnt;
        } catch (e: any) {
            diagnostics.memory_error = e.message;
        }

        await sql.end();
    } catch (e: any) {
        diagnostics.connection_test = 'FAILED';
        diagnostics.error = {
            message: e.message,
            code: e.code,
            severity: e.severity,
            detail: e.detail,
            hint: e.hint,
            cause: e.cause?.message,
            name: e.name,
            keys: Object.keys(e),
        };
        await sql.end().catch(() => { });
    }

    return NextResponse.json(diagnostics, {
        status: diagnostics.connection_test === 'SUCCESS' ? 200 : 500,
    });
}
