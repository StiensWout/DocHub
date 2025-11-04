# DocHub - Development Guide

This guide covers development workflows, best practices, and common tasks for contributing to DocHub.

## 🏗️ Project Architecture

### Tech Stack Overview

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Bun**: Package manager and runtime
- **Supabase**: Backend-as-a-Service (PostgreSQL + Storage + Auth-ready)
- **Tiptap**: Rich text editor framework

### Directory Structure

```
DocHub/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── DocumentEditor.tsx         # Rich text editor
│   ├── DocumentViewer.tsx        # Document display
│   ├── DocumentVersionHistory.tsx # Version history viewer
│   ├── NewDocumentDialog.tsx     # Create document dialog
│   ├── SearchBar.tsx             # Search functionality
│   ├── TeamSelector.tsx          # Team selection dropdown
│   └── TemplateSelector.tsx      # Template selection
├── lib/                   # Shared library code
│   ├── supabase/
│   │   ├── client.ts      # Client-side Supabase client
│   │   ├── server.ts      # Server-side Supabase client
│   │   ├── queries.ts     # Database query functions
│   │   ├── search.ts      # Search logic and relevance scoring
│   │   └── seed.ts        # Database seeding function
│   └── templates.ts      # Template utilities
├── scripts/               # Utility scripts
│   ├── seed.ts          # Script runner for seeding
│   ├── validate.ts      # Database validation script
│   └── check-db.ts      # Database connection checker
├── supabase/             # Database schemas
│   ├── purge.sql                # Remove all database objects
│   ├── create.sql               # Create complete schema
│   ├── database_dump.sql        # Current schema (source of truth)
├── types/                # TypeScript type definitions
│   └── index.ts         # Shared types
└── docs/                 # Documentation
```

## 🚀 Development Workflow

### Starting Development

1. **Start the development server:**
   ```bash
   bun run dev
   ```

2. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Hot reload is enabled - changes reflect immediately

3. **Make changes:**
   - Edit files in `app/`, `components/`, or `lib/`
   - Browser will auto-reload
   - Check browser console for errors

### Database Changes

When modifying database schema:

1. **Update SQL files:**
  - Edit `supabase/create.sql` with schema changes
  - Update `supabase/database_dump.sql` by running the dump script

2. **Test locally:**
   - Run schema changes in Supabase SQL Editor
   - Test with `bun run validate`
   - Verify seed script still works

3. **Update TypeScript types:**
   - Add types to `types/index.ts` if needed
   - Update queries in `lib/supabase/queries.ts`

### Adding New Features

1. **Plan the feature:**
   - Check `docs/ROADMAP.md` for planned features
   - Create feature branch: `git checkout -b feat/feature-name`

2. **Implement:**
   - Create/update components in `components/`
   - Add queries in `lib/supabase/queries.ts`
   - Update types in `types/index.ts`

3. **Test:**
   - Test manually in browser
   - Run `bun run validate` for database changes
   - Check for TypeScript errors: `bun run lint`

4. **Update documentation:**
   - Update `docs/COMPLETED.md` if feature is complete
   - Update relevant docs
   - Add to `docs/ROADMAP.md` if planning future work

5. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   git push origin feat/feature-name
   ```

## 📝 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types in `types/index.ts` for shared types
- Use interfaces for object shapes
- Avoid `any` - use `unknown` if type is truly unknown

### React Components

- Use functional components with hooks
- Name components with PascalCase: `DocumentEditor.tsx`
- Export components as default exports
- Keep components focused and single-purpose

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` or `index.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

### Code Organization

- Keep related code together
- Separate concerns (UI, logic, data)
- Use meaningful variable and function names
- Add comments for complex logic

## 🗄️ Database Patterns

### Query Functions

All database queries should be in `lib/supabase/queries.ts`:

```typescript
// Example query function
export async function getTeamDocuments(teamId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('team_documents')
    .select('*')
    .eq('team_id', teamId);
  
  if (error) throw error;
  return data;
}
```

### Error Handling

Always handle errors:

```typescript
try {
  const data = await getTeamDocuments(teamId);
  // Use data
} catch (error) {
  console.error('Error fetching documents:', error);
  // Show user-friendly error message
}
```

### Type Safety

Use TypeScript types for database results:

```typescript
import type { TeamDocument } from '@/types';

const documents: TeamDocument[] = await getTeamDocuments(teamId);
```

## 🧪 Testing

### Manual Testing

Test these areas before committing:

- ✅ Create document
- ✅ Edit document
- ✅ Delete document
- ✅ Search functionality
- ✅ Template selection
- ✅ Image upload
- ✅ Team switching
- ✅ Version history

### Database Validation

Run validation script:

```bash
bun run validate
```

This checks:
- Database connection
- Tables exist
- Sample data present
- Relationships valid

### Linting

Check code style:

```bash
bun run lint
```

Fix auto-fixable issues:

```bash
bun run lint --fix
```

## 🔧 Common Development Tasks

### Adding a New Component

1. Create file in `components/`:
   ```typescript
   // components/MyComponent.tsx
   export default function MyComponent() {
     return <div>My Component</div>;
   }
   ```

2. Import and use:
   ```typescript
   import MyComponent from '@/components/MyComponent';
   ```

### Adding a New Database Query

1. Add to `lib/supabase/queries.ts`:
   ```typescript
   export async function myNewQuery(params: MyParams) {
     const supabase = createServerClient();
     // Query logic
   }
   ```

2. Add types to `types/index.ts` if needed

3. Use in components:
   ```typescript
   const data = await myNewQuery(params);
   ```

### Adding a New Template

1. Insert into database via SQL or seed script:
   ```sql
   INSERT INTO document_templates (name, description, content, category)
   VALUES ('Template Name', 'Description', '<h1>Content</h1>', 'Category');
   ```

2. Or add to seed script in `lib/supabase/seed.ts`

### Modifying Database Schema

1. Update `supabase/create.sql` with schema changes
2. Run `supabase/purge.sql` to test cleanup (if needed)
3. Update `supabase/database_dump.sql` by running the dump script
3. Test locally first
4. Update TypeScript types if needed
5. Update queries if schema changes affect them

## 🐛 Debugging

### Common Issues

**Database connection errors:**
- Check `.env.local` has correct values
- Verify Supabase project is active
- Check network connectivity

**TypeScript errors:**
- Run `bun run lint` to see all errors
- Check type definitions in `types/`
- Ensure imports are correct

**Build errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && bun install`
- Check for TypeScript errors

**Runtime errors:**
- Check browser console for errors
- Check server logs in terminal
- Verify environment variables

### Debugging Tools

- **Browser DevTools**: Inspect elements, check console
- **Supabase Dashboard**: View database, check logs
- **Next.js DevTools**: Built-in debugging
- **TypeScript**: Compile-time error checking

## 📦 Building for Production

### Build

```bash
bun run build
```

This creates optimized production build in `.next/` folder.

### Test Production Build

```bash
bun run start
```

This runs production server locally for testing.

### Deployment Checklist

Before deploying:

- [ ] Run `bun run build` successfully
- [ ] Test production build locally
- [ ] Verify environment variables are set
- [ ] Check database migrations are applied
- [ ] Verify storage bucket exists
- [ ] Test critical user flows
- [ ] Check for console errors

## 🔐 Security Considerations

### Environment Variables

- Never commit `.env.local`
- Use different keys for dev/prod
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use `NEXT_PUBLIC_` prefix only for public values

### Database Security

- RLS policies are in place
- Service role key should only be used server-side
- Never expose service role key to client

### Storage Security

- Verify storage policies are correct
- Consider file type validation
- Set reasonable file size limits

## 📚 Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tiptap Documentation](https://tiptap.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Read this guide
2. Check `docs/ROADMAP.md` for planned work
3. Create feature branch
4. Make changes following these guidelines
5. Test thoroughly
6. Update documentation
7. Submit pull request

---

**Questions?** Check other documentation files or create an issue.

