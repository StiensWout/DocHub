import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Server-side client with service key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)