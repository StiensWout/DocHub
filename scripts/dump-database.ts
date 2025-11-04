#!/usr/bin/env bun

/**
 * Database Dump Script
 * 
 * Creates a complete dump of the current Supabase database schema.
 * This dump should be used as the source of truth for database documentation.
 * 
 * Usage:
 *   bun run scripts/dump-database.ts
 * 
 * Note: This script uses Supabase CLI. For direct PostgreSQL connection,
 * ensure you have SUPABASE_DB_URL set in your environment.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

/**
 * Get database connection string from Supabase URL
 * 
 * Note: Supabase offers multiple connection methods:
 * - Direct connection (port 5432) - requires IP allowlisting
 * - Connection pooler (port 6543) - recommended for external connections
 * - Session pooler (port 5432) - alternative pooler
 */
function getDbUrl(): string | null {
  // Try direct connection string first
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    return dbUrl;
  }

  // Try constructing from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (supabaseUrl && dbPassword) {
    // Extract project ref from URL
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      
      // Try connection pooler first (more reliable for external connections)
      // Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
      // Note: We'll use the db.* format as fallback since we don't know the region
      
      // Try direct connection format
      return `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }

  return null;
}

/**
 * Check if pg_dump is available and add to PATH if needed
 */
async function ensurePgDump(): Promise<boolean> {
  try {
    await execAsync('pg_dump --version');
    return true;
  } catch {
    // Try common PostgreSQL installation paths on Windows
    const commonPaths = [
      'C:\\Program Files\\PostgreSQL\\17\\bin',
      'C:\\Program Files\\PostgreSQL\\16\\bin',
      'C:\\Program Files\\PostgreSQL\\15\\bin',
      'C:\\Program Files\\PostgreSQL\\14\\bin',
      'C:\\Program Files (x86)\\PostgreSQL\\17\\bin',
      'C:\\Program Files (x86)\\PostgreSQL\\16\\bin',
    ];
    
    // Check if any of these paths exist and contain pg_dump.exe
    for (const pgPath of commonPaths) {
      const pgDumpPath = path.join(pgPath, 'pg_dump.exe');
      if (existsSync(pgDumpPath)) {
        // Add to PATH for this process
        const currentPath = process.env.PATH || '';
        process.env.PATH = `${pgPath};${currentPath}`;
        console.log(`✅ Found PostgreSQL at: ${pgPath}`);
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Create database dump using Supabase CLI
 */
async function createDumpWithCLI(dbUrl: string): Promise<void> {
  const outputPath = path.join(process.cwd(), 'supabase', 'database_dump.sql');
  
  console.log('📊 Creating database dump using Supabase CLI...');
  
  try {
    // Supabase CLI doesn't support --schema-only, so we use --schema public
    // and it will dump schema by default (not data unless --data-only is specified)
    const { stdout, stderr } = await execAsync(
      `supabase db dump --db-url "${dbUrl}" --schema public -f "${outputPath}"`
    );
    
    if (stderr && !stderr.includes('warning')) {
      console.warn('⚠️  Warnings:', stderr);
    }
    
    if (stdout) {
      console.log(stdout);
    }
    
    console.log(`✅ Database dump created: ${outputPath}`);
  } catch (error: any) {
    throw new Error(`Failed to create dump: ${error.message}`);
  }
}

/**
 * Create database dump using pg_dump directly
 */
async function createDumpWithPgDump(dbUrl: string): Promise<void> {
  const outputPath = path.join(process.cwd(), 'supabase', 'database_dump.sql');
  
  console.log('📊 Creating database dump using pg_dump...');
  
  try {
    // Use pg_dump to create schema-only dump
    // Note: Supabase requires SSL, so we don't disable it
    const { stdout, stderr } = await execAsync(
      `pg_dump "${dbUrl}" --schema=public --schema-only --no-owner --no-privileges --no-tablespaces`
    );
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('SSL')) {
      console.warn('⚠️  Warnings:', stderr);
    }
    
    // Write dump to file
    fs.writeFileSync(outputPath, stdout, 'utf-8');
    
    console.log(`✅ Database dump created: ${outputPath}`);
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    
    // Check for DNS resolution issues
    if (errorMsg.includes('could not translate host name') || errorMsg.includes('Name or service not known')) {
      throw new Error(`DNS resolution failed for direct connection.\n\n` +
        `⚠️  Direct connections (db.*.supabase.co) may only resolve to IPv6 or require IP allowlisting.\n\n` +
        `✅ SOLUTION: Use the Connection Pooler instead:\n` +
        `   1. Go to: Supabase Dashboard → Settings → Database\n` +
        `   2. Click "Connection pooling" tab\n` +
        `   3. Select "Session mode"\n` +
        `   4. Copy the connection string (format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres)\n` +
        `   5. Set it as SUPABASE_DB_URL in your .env.local\n\n` +
        `The pooler uses IPv4 and doesn't require IP allowlisting.`);
    }
    
    throw new Error(`Failed to create dump: ${errorMsg}`);
  }
}

/**
 * Generate database dump file
 */
async function generateDump() {
  try {
    console.log('🗄️  Starting database dump...\n');

    const dbUrl = getDbUrl();
    
    if (!dbUrl) {
      console.error('❌ Missing database connection information.');
      console.error('\nPlease set one of the following:');
      console.error('   1. SUPABASE_DB_URL (full connection string)');
      console.error('   2. DATABASE_URL (full connection string)');
      console.error('   3. NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD');
      console.error('\nExample:');
      console.error('   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"');
      console.error('\nYou can find the connection string in:');
      console.error('   Supabase Dashboard → Settings → Database → Connection string');
      process.exit(1);
    }

    // Prefer pg_dump when we have a direct connection string (more reliable, no Docker required)
    console.log('📊 Checking for pg_dump...');
    let usePgDump = false;
    
    usePgDump = await ensurePgDump();
    
    if (usePgDump) {
      console.log('✅ Found pg_dump, using it directly (no Docker required)\n');
    } else {
      console.log('⚠️  pg_dump not found, trying Supabase CLI...\n');
    }

    if (usePgDump) {
      await createDumpWithPgDump(dbUrl);
    } else {
      // Try Supabase CLI as fallback (requires Docker)
      const hasCLI = await checkSupabaseCLI();
      
      if (hasCLI) {
        console.log('⚠️  Note: Supabase CLI may require Docker Desktop');
        console.log('   If you encounter Docker errors, install PostgreSQL client tools\n');
        await createDumpWithCLI(dbUrl);
      } else {
        console.error('❌ Neither pg_dump nor Supabase CLI found.');
        console.error('\nPlease install one of the following:');
        console.error('   1. PostgreSQL client tools (includes pg_dump) - Recommended');
        console.error('      Windows: https://www.postgresql.org/download/windows/');
        console.error('      Mac: brew install postgresql');
        console.error('      Linux: sudo apt-get install postgresql-client');
        console.error('   2. Supabase CLI: npm install -g supabase (requires Docker)');
        console.error('\nOr manually create dump using:');
        console.error('   pg_dump "YOUR_URL" --schema=public --schema-only --no-owner --no-privileges > supabase/database_dump.sql');
        process.exit(1);
      }
    }
    
    console.log('\n📝 Database dump complete!');
    console.log('   Use this file as the source of truth for database documentation.');
    
  } catch (error: any) {
    console.error('❌ Error generating dump:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Verify your database connection string is correct');
    console.error('   2. Check DNS resolution:');
    console.error('      - Try: nslookup db.[PROJECT_REF].supabase.co');
    console.error('      - Or: ping db.[PROJECT_REF].supabase.co');
    console.error('   3. Network connectivity:');
    console.error('      - Check firewall settings');
    console.error('      - Verify VPN/proxy settings if applicable');
    console.error('      - Ensure your IP is allowed in Supabase dashboard');
    console.error('   4. Try using connection pooler instead:');
    console.error('      - Get connection string from: Supabase Dashboard → Settings → Database');
    console.error('      - Use "Connection pooling" → "Session mode" or "Transaction mode"');
    console.error('      - Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
    console.error('   5. Alternative: Use Supabase Dashboard SQL Editor to export schema');
    process.exit(1);
  }
}

// Run the dump
generateDump();

