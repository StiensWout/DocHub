# Component Architecture

Documentation of DocHub's React component structure, patterns, and organization.

## 📦 Component Overview

DocHub uses a component-based architecture with reusable React components. All components are functional components using React hooks.

## 🗂️ Component Structure

### Layout Components

#### `Sidebar.tsx`
Persistent navigation sidebar with collapsible sections.

**Features:**
- Team selector
- Application groups (collapsible)
- Quick access (recent documents)
- Actions (New Document, Upload File)
- Keyboard navigation
- Responsive overlay mode

**State:**
- `sidebarCollapsed` - Sidebar visibility
- `expandedGroups` - Group expansion state
- `applications` - Application list
- `groups` - Application groups

**LocalStorage:**
- `sidebarCollapsed` - Persist sidebar state
- `expandedGroups` - Persist group expansion

---

#### `Breadcrumbs.tsx`
Dynamic breadcrumb navigation showing current location.

**Features:**
- Team → Application → Document path
- Clickable navigation items
- Mobile-friendly with back button
- Truncation for long paths

---

### Document Components

#### `DocumentViewer.tsx`
Main document viewing component.

**Features:**
- HTML content rendering
- Print-friendly view
- Export to PDF
- Export to Markdown
- Share document link
- File attachments display
- Version history button

**Actions:**
- Edit document
- Delete document
- Print document
- Export document
- Share document
- View version history

---

#### `DocumentEditor.tsx`
Rich text editor using Tiptap.

**Features:**
- Text formatting (bold, italic, headings)
- Lists (bullet, numbered)
- Links
- Images (upload to Supabase Storage)
- Tables
- Code blocks
- Blockquotes
- Keyboard shortcuts
- Auto-save indicator

**State:**
- Editor instance
- Content
- Saving state

---

#### `DocumentVersionHistory.tsx`
Version history viewer and comparator.

**Features:**
- List all versions
- Version comparison
- Restore previous versions
- Version metadata (timestamp, changes)

---

#### `NewDocumentDialog.tsx`
Dialog for creating new documents.

**Features:**
- Document type selection (Base/Team)
- Title and category input
- Template selector
- Form validation

---

### Search Components

#### `SearchBar.tsx`
Global search component with advanced features.

**Features:**
- Real-time search (debounced)
- Search suggestions/autocomplete
- Search history
- Result filtering (All, Apps, Groups, Docs)
- Keyboard navigation
- Fuzzy matching
- Result highlighting

**State:**
- Search query
- Search results (documents, applications, groups)
- Suggestions
- Search history
- Active filter
- Active suggestion index

**LocalStorage:**
- Search history (max 50 items)

---

### Application Components

#### `ApplicationDetails.tsx`
Application detail view showing documents.

**Features:**
- Application info display
- Document list (Base and Team)
- Document filtering
- Create document button
- Application files display

---

#### `ApplicationCreateDialog.tsx`
Dialog for creating new applications.

**Features:**
- Application name input
- Icon picker
- Color picker
- Group assignment
- ID generation
- Validation

---

#### `ApplicationEditDialog.tsx`
Dialog for editing existing applications.

**Features:**
- Edit name
- Change icon
- Change color
- Change group
- Save validation

---

#### `ApplicationGroupManager.tsx`
Manager for application groups.

**Features:**
- List groups
- Create group
- Edit group
- Delete group
- Drag-and-drop (future)

---

#### `IconPicker.tsx`
Icon selector component using Lucide icons.

**Features:**
- Search icons
- Icon preview
- Filtering

---

#### `ColorPicker.tsx`
Color selector using Tailwind colors.

**Features:**
- Color grid
- Color preview

---

### File Components

#### `FileUploadButton.tsx`
Button for uploading files to documents.

**Features:**
- File selection
- Upload progress
- Error handling
- File validation

---

#### `FileViewer.tsx`
Component for viewing various file types.

**Features:**
- PDF viewer (multi-page)
- Image viewer
- Text file viewer
- DOCX viewer
- Generic download fallback

---

#### `ApplicationFiles.tsx`
Component for displaying application-level files.

**Features:**
- File list
- Download files
- Delete files
- File type icons

---

### Template Components

#### `TemplateSelector.tsx`
Template selection dialog with search.

**Features:**
- Template search
- Category filtering
- Template preview
- Application filtering

---

### UI Components

#### `Toast.tsx`
Toast notification system.

**Features:**
- Success, error, warning, info types
- Auto-dismiss
- Manual dismiss
- Slide-in animation
- Multiple toasts

---

#### `TeamSelector.tsx`
Team selection dropdown.

**Features:**
- Team list
- Current team highlight
- Team switching

---

## 🎨 Styling Patterns

### Tailwind CSS

All components use Tailwind utility classes:
- `bg-gray-900` - Background colors
- `text-white` - Text colors
- `border-gray-700` - Border colors
- `rounded-lg` - Border radius
- `shadow-lg` - Shadows

### CSS Variables

Theme variables defined in `app/globals.css`:
- `--background` - Page background
- `--foreground` - Text color
- `--border` - Border color
- `--accent` - Accent color

### Dynamic Colors

Application colors applied via inline styles:
```tsx
style={{ 
  color: getColorValues(app.color),
  backgroundColor: `${getColorValues(app.color)}20`
}}
```

## 🔄 State Management

### Component State

- `useState` for local component state
- `useEffect` for side effects
- Custom hooks for shared logic

### Persistence

- `localStorage` for UI preferences:
  - Sidebar collapse state
  - Group expansion state
  - Recent documents
  - Search history

### Server State

- Supabase queries in `lib/supabase/queries.ts`
- Direct Supabase calls in components
- No global state management (keeping it simple)

## 🎯 Component Patterns

### Data Fetching

```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [dependencies]);
```

### Form Handling

```tsx
const [formData, setFormData] = useState(initialState);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Validation
  // Submit
};
```

### Loading States

```tsx
{loading ? (
  <LoadingSkeleton />
) : (
  <Content data={data} />
)}
```

## 📁 File Organization

```
components/
├── DocumentEditor.tsx
├── DocumentViewer.tsx
├── DocumentVersionHistory.tsx
├── NewDocumentDialog.tsx
├── SearchBar.tsx
├── Sidebar.tsx
├── Breadcrumbs.tsx
├── TeamSelector.tsx
├── TemplateSelector.tsx
├── ApplicationDetails.tsx
├── ApplicationCreateDialog.tsx
├── ApplicationEditDialog.tsx
├── ApplicationGroupManager.tsx
├── IconPicker.tsx
├── ColorPicker.tsx
├── FileUploadButton.tsx
├── FileViewer.tsx
├── ApplicationFiles.tsx
└── Toast.tsx
```

## 🔧 Reusable Patterns

### Modal Dialogs

```tsx
const [isOpen, setIsOpen] = useState(false);

<div className="fixed inset-0 z-50 ...">
  <div className="modal-content">
    {/* Content */}
  </div>
</div>
```

### Dropdown Menus

```tsx
const [isOpen, setIsOpen] = useState(false);

<div className="relative">
  <button onClick={() => setIsOpen(!isOpen)}>...</button>
  {isOpen && (
    <div className="absolute ...">
      {/* Dropdown content */}
    </div>
  )}
</div>
```

### Keyboard Navigation

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    // Navigate down
  } else if (e.key === 'Enter') {
    // Select
  }
};
```

## 📚 Related Documentation

- [Architecture Overview](OVERVIEW.md) - High-level architecture
- [Database Architecture](DATABASE.md) - Database schema
- [Development Guide](../DEVELOPMENT/GUIDE.md) - Development workflow

---

**Last Updated**: 2025-01-30

