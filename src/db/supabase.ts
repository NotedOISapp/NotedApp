import { createClient } from '@supabase/supabase-js';

// Use NEXT_PUBLIC_ vars (always available) or fallback to SUPABASE_ vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
    console.warn('⚠️ SUPABASE_URL not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
});
