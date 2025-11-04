import 'server-only'; // This marks the entire file as server-only
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both new API keys (sb_secret_...) and legacy JWT-based keys (eyJ...)
const supabaseServiceKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase service role environment variables. Set SUPABASE_SECRET_KEY (new) or SUPABASE_SERVICE_ROLE_KEY (legacy)");
}

// Server-side client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
