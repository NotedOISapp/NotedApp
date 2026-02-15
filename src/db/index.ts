import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load dotenv only in local dev (Vercel provides env vars natively)
if (process.env.NODE_ENV !== 'production') {
    try { require('dotenv').config({ path: '.env' }); } catch { }
}

// Connection String from Env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

// Client - SSL required for Supabase from Vercel
const client = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
});
export const db = drizzle(client, { schema });
