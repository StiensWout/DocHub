import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both new API keys (sb_publishable_...) and legacy JWT-based keys (eyJ...)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
