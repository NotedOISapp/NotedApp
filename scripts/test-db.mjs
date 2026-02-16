import postgres from 'postgres';

// Test 1: Direct connection (port 5432) — what works locally
const directUrl = 'postgres://postgres:Freshstart20522!@db.kbkwfaojtwpebzyrjhpw.supabase.co:5432/postgres';

console.log('=== Test 1: Direct Connection (5432) ===');
const sql1 = postgres(directUrl, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    connect_timeout: 10,
});

try {
    const r = await sql1`SELECT count(*) as agent_count FROM agents`;
    console.log('✅ Direct connection WORKS. Agents:', r[0].agent_count);
    await sql1.end();
} catch (e) {
    console.error('❌ Direct FAILED:', e.message);
    await sql1.end().catch(() => { });
}

// Test 2: Session pooler (port 5432 via pooler host)
const sessionUrl = 'postgres://postgres.kbkwfaojtwpebzyrjhpw:Freshstart20522!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

console.log('\n=== Test 2: Session Pooler (5432) ===');
const sql2 = postgres(sessionUrl, {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10,
});

try {
    const r = await sql2`SELECT count(*) as agent_count FROM agents`;
    console.log('✅ Session pooler WORKS. Agents:', r[0].agent_count);
    await sql2.end();
} catch (e) {
    console.error('❌ Session pooler FAILED:', e.message);
    await sql2.end().catch(() => { });
}

// Test 3: Transaction pooler (port 6543 via pooler host)
const txnUrl = 'postgres://postgres.kbkwfaojtwpebzyrjhpw:Freshstart20522!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

console.log('\n=== Test 3: Transaction Pooler (6543) ===');
const sql3 = postgres(txnUrl, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    connect_timeout: 10,
});

try {
    const r = await sql3`SELECT count(*) as agent_count FROM agents`;
    console.log('✅ Transaction pooler WORKS. Agents:', r[0].agent_count);
    await sql3.end();
} catch (e) {
    console.error('❌ Transaction pooler FAILED:', e.message);
    await sql3.end().catch(() => { });
}

process.exit(0);
