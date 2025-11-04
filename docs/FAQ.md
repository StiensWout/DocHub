# Frequently Asked Questions

---

## Authentication

### How do I set up authentication?

See the [WorkOS Setup Guide](SETUP/WORKOS.md) for step-by-step instructions.

### Can I use multiple SSO providers?

Yes! DocHub uses WorkOS which supports multiple providers. You can configure different organizations with different providers. See [SSO Configuration](SETUP/SSO.md).

### How do I switch SSO providers?

You can switch providers without code changes - just update the configuration in WorkOS Dashboard. See [Provider Migration Guide](SETUP/PROVIDER_MIGRATION.md).

### What authentication methods are supported?

- **SSO**: Any provider supported by WorkOS (Microsoft, Google, Okta, SAML, OIDC)
- **Email/Password**: WorkOS User Management
- **Future**: MFA, Magic Link, Passkeys (pending)

---

## Teams & Organizations

### How are teams created?

Teams are automatically created from WorkOS Organizations. When a user joins a WorkOS organization, corresponding teams are created in DocHub. See [GitHub Issues](https://github.com/StiensWout/DocHub/issues) for feature details.

### What's the difference between organizations and teams?

- **Organizations**: WorkOS organizations (e.g., "CDLE")
- **Teams**: User roles within organizations (e.g., "Developer" role in "CDLE")
- Only teams (roles) become DocHub teams, not parent organizations

### How do I grant admin access?

Admin access is granted via WorkOS Organizations. See [Admin Setup Guide](ADMIN_SETUP.md).

### Can I manually create teams?

Currently, teams are auto-created from WorkOS Organizations. Manual team management is planned for the future.

---

## Documents

### How do I create a document?

Click the "+" button or use the document creation dialog. Documents can be base (shared) or team-specific.

### What document types are supported?

- **Base Documents**: Shared across all teams
- **Team Documents**: Visible only to team members

You can switch document types after creation via the metadata editor.

### Can I edit document metadata?

Yes! Click the settings (gear) icon in the document viewer to edit title, category, document type, and tags.

### How do tags work?

Tags help organize documents. You can:
- Add tags when creating documents
- Edit tags via the metadata editor
- Filter documents by tags in search
- Create new tags (admin only, or via UI)

---

## Search

### How does search work?

Search works in real-time as you type. It searches:
- Document titles and content
- Application names
- Application group names

Search functionality is documented in [GitHub Issues](https://github.com/StiensWout/DocHub/issues).

### Can I filter search results?

Yes! You can filter by:
- Application
- Category
- Document type (base/team)
- Tags (multiple tags with AND logic)

### How do I use search suggestions?

Start typing and suggestions will appear based on:
- Document titles
- Categories
- Application names

### What's search history?

Search history stores your recent searches locally in your browser. Click on a recent search to re-run it.

---

## Files

### What file types can I attach?

Common file types:
- PDFs
- Word documents (DOCX)
- Spreadsheets (XLSX)
- Presentations (PPTX)
- Images (JPG, PNG, GIF, etc.)

### Can I view files in the app?

Yes! Many file types can be viewed directly in the app without downloading:
- PDFs
- Images
- Office documents (via viewer)

### How do I upload files?

Files are uploaded when creating or editing documents. See the file upload section in the document editor.

---

## Setup & Configuration

### What environment variables do I need?

See [Configuration Guide](GETTING_STARTED/CONFIGURATION.md) for all required variables.

**Essential**:
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_USE_ORGANIZATIONS=true`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI`

### How do I set up Supabase?

See [Supabase Setup Guide](GETTING_STARTED/SUPABASE_SETUP.md).

### What's the redirect URI for?

The redirect URI is where WorkOS sends users after authentication. Set it in both:
- Your `.env` file
- WorkOS Dashboard → Redirect URIs

---

## Development

### How do I contribute?

See the [Development Guide](DEVELOPMENT/GUIDE.md) for contribution guidelines.

### What's the code structure?

See [Architecture Overview](ARCHITECTURE/OVERVIEW.md) and [Components](ARCHITECTURE/COMPONENTS.md).

### How do I run tests?

See [Testing Guide](DEVELOPMENT/TESTING.md).

---

## Troubleshooting

### Authentication isn't working

- Check environment variables are set correctly
- Verify redirect URI matches WorkOS Dashboard
- Check API key and Client ID are correct
- See [Troubleshooting Guide](TROUBLESHOOTING.md)

### Teams aren't syncing

- Verify `WORKOS_USE_ORGANIZATIONS=true` in `.env`
- Check users are in WorkOS Organizations
- Ensure API key has Organizations permissions

### Documents aren't showing

- Check user is in correct team
- Verify document type (base vs team)
- Check access control settings

### Search isn't working

- Ensure you've typed at least 2 characters
- Check filters aren't too restrictive
- Verify search index is built (if applicable)

---

## General

### What is DocHub?

DocHub is a documentation management system with team-based access control, built on Next.js, Supabase, and WorkOS.

### What's the difference between base and team documents?

- **Base Documents**: Shared across all teams (organization-wide)
- **Team Documents**: Visible only to specific team members

### Can I export documents?

Yes! Documents can be exported as:
- PDF
- Markdown

Use the export options in the document viewer.

### Is there an API?

API endpoints exist for core functionality. Full API documentation is planned.

---

## Still Have Questions?

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Documentation Index](INDEX.md)
- See [Status](STATUS.md) for current features

