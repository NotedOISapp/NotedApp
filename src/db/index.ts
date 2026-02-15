import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from "dotenv";
import * as schema from './schema';

dotenv.config({ path: ".env" });

// Connection String from Env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

// Client
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
