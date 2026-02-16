import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load dotenv only in local dev (Vercel provides env vars natively)
if (process.env.NODE_ENV !== 'production') {
    try { require('dotenv').config({ path: '.env' }); } catch { }
}

// Connection String from Env
// Connection String from Env (fallback to dummy to prevent module-level crash)
const connectionString = process.env.DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/placeholder";

// Client - SSL required for Supabase from Vercel
const client = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    prepare: false, // Required for Transaction Pooler (6543), harmless for Session (5432)
});
export const db = drizzle(client, { schema });
