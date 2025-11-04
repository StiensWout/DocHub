# Installation Guide

Complete step-by-step guide for setting up DocHub from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Bun** (v1.0 or higher) - [Installation Guide](https://bun.sh/docs/installation)
- **Git** - For cloning the repository
- **Supabase Account** - [Sign up for free](https://supabase.com)
- **Text Editor** - VS Code or your preferred editor

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/StiensWout/DocHub.git
cd DocHub
```

### Step 2: Install Dependencies

```bash
bun install
```

This installs all required packages:
- Next.js and React dependencies
- Supabase client libraries
- Tiptap editor and extensions
- Tailwind CSS and utilities
- TypeScript types

### Step 3: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name (e.g., "DocHub")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to initialize (2-3 minutes)

### Step 4: Configure Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get these from**: Supabase Dashboard → Settings → API

**⚠️ Important:**
- Never commit `.env.local` to version control
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret

### Step 5: Set Up Database Schema

You have three options for setting up the database:

**Option A: Use Database Dump (Recommended)**
- Check if `supabase/database_dump.sql` exists
- If available, run it in Supabase SQL Editor for the complete, up-to-date schema
- See [Database Dump Guide](../INFRASTRUCTURE/DATABASE_DUMP.md) for more information

**Option B: Complete Schema Reset**
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Open `supabase/purge.sql` in your editor
4. Copy the entire contents and paste into Supabase SQL Editor
5. Click **"Run"** (this removes all existing data)
6. Open `supabase/create.sql` in your editor
7. Copy the entire contents and paste into Supabase SQL Editor
8. Click **"Run"** (this creates the complete schema)

> **Note**: For the most up-to-date schema, always check `supabase/database_dump.sql` first. See [Database Dump Guide](../INFRASTRUCTURE/DATABASE_DUMP.md) for information on exporting the schema.

### Step 6: Configure Storage

See [Configuration Guide](CONFIGURATION.md#storage-setup) for detailed storage setup instructions.

### Step 7: Seed the Database

Populate the database with sample data:

```bash
bun run seed
```

This creates:
- 3 Teams (Application, Systems, Support)
- 2 Applications (Customer Portal, Admin Dashboard)
- Sample documents and templates

### Step 8: Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Homepage loads without errors
- [ ] Team selector shows teams
- [ ] Application cards display
- [ ] Can view documents
- [ ] Can create new documents
- [ ] Can edit documents
- [ ] Can delete documents
- [ ] Search functionality works
- [ ] Templates appear when creating documents
- [ ] Can upload images in editor

## 🐛 Troubleshooting

### Database Connection Errors

**Error**: "Missing Supabase environment variables"

**Solution**:
- Verify `.env.local` exists in project root
- Check all three environment variables are set
- Restart development server after changing `.env.local`

**Error**: "Failed to fetch" or connection timeout

**Solution**:
- Verify Supabase project is active (not paused)
- Check project URL is correct
- Run `bun run check-db` to test connection

### Schema Setup Issues

**Error**: "relation already exists"

**Solution**:
- If using Option A, it handles drops automatically
- If using Option B, check which tables already exist
- Use Option A for fresh setup

### Storage Issues

**Error**: Images not uploading

**Solution**:
- Verify `documents` bucket exists
- Check bucket is set to Public
- Verify storage policies are created
- See [Configuration Guide](CONFIGURATION.md#storage-setup)

### Seed Script Issues

**Error**: "No teams were created"

**Solution**:
- Verify database schema is set up first
- Check environment variables are correct
- Verify Supabase service role key has permissions
- Check Supabase project is not paused

## 📚 Next Steps

1. **Read Configuration Guide**: [Configuration](CONFIGURATION.md)
2. **Review Architecture**: [Architecture Overview](../ARCHITECTURE/OVERVIEW.md)
3. **Start Developing**: [Development Guide](../DEVELOPMENT/GUIDE.md)

---

**Need help?** Check the troubleshooting section above or review related documentation.

