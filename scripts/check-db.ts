import { createClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test connection and check if tables exist
async function checkDatabase() {
  console.log("🔍 Checking Supabase connection...");
  console.log(`📡 URL: ${supabaseUrl}`);
  
  // Test connection by checking if we can query
  const { data: tables, error } = await supabaseAdmin
    .rpc('exec_sql', { 
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 
    });

  // Alternative: try to query each table
  const tableNames = ['teams', 'applications', 'base_documents', 'team_documents'];
  const tableStatus: Record<string, boolean> = {};
  
  for (const tableName of tableNames) {
    const { error } = await supabaseAdmin.from(tableName).select('*').limit(1);
    tableStatus[tableName] = !error;
  }
  
  console.log("\n📊 Table Status:");
  for (const [table, exists] of Object.entries(tableStatus)) {
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }
  
  const missingTables = Object.entries(tableStatus).filter(([_, exists]) => !exists).map(([name]) => name);
  
  if (missingTables.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    console.log("\n📝 Next steps:");
    console.log("1. Go to your Supabase Dashboard -> SQL Editor");
    console.log("2. Copy and paste the contents of supabase/schema.sql");
    console.log("3. Run the SQL query");
    console.log("4. Then run 'bun run seed' again");
  } else {
    console.log("\n✅ All tables exist! You can run 'bun run seed' now.");
  }
}

checkDatabase().catch(console.error);
