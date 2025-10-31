# Supabase Setup Guide

## Finding Your Supabase Service Role Key

The Supabase Service Role Key is a secret key that bypasses Row Level Security (RLS) policies. It's already created by Supabase when you create a project - you just need to find it in your dashboard.

### Steps to Get Your Service Role Key

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in if needed

2. **Select Your Project**
   - Choose the project you're working with

3. **Navigate to Project Settings**
   - Click on the **Settings** icon (gear icon) in the left sidebar
   - Or go to: **Settings** → **API**

4. **Find the Service Role Key**
   - Scroll down to the **API Keys** section
   - You'll see two keys:
     - **anon** `public` key - This is the public/client key (safe to expose)
     - **service_role** `secret` key - This is the service role key (NEVER expose this!)

5. **Copy the Service Role Key**
   - Click the **eye icon** or **reveal** button next to the `service_role` key
   - Copy the entire key (it starts with `eyJ...`)

### Adding to Your Environment Variables

Once you have the service role key, add it to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Service role key (SECRET!)
```

### Important Security Notes

⚠️ **NEVER commit the service role key to version control!**

- The service role key has full access to your database
- It bypasses all Row Level Security (RLS) policies
- It can read, write, and delete any data
- Always keep it in `.env.local` (which should be in `.gitignore`)
- Never share it publicly or in screenshots

### Verifying Your Setup

After adding the key, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
# or
bun dev
```

The service role key is used by:
- Server-side operations that need to bypass RLS
- Admin operations (creating applications, managing users, etc.)
- Background jobs and automated tasks

### Troubleshooting

**Error: "Missing Supabase service role environment variables"**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Make sure the `.env.local` file is in the project root
- Restart your development server after adding the key

**Error: "Invalid API key"**
- Double-check you copied the entire key (it's very long)
- Make sure you copied the `service_role` key, not the `anon` key
- Verify there are no extra spaces or line breaks

