# Documentation Style Guide

This guide establishes standards for writing and maintaining DocHub documentation.

## Principles

- **Clarity**: Documentation should be clear and easy to understand
- **Consistency**: Follow established patterns and conventions
- **Completeness**: Include all necessary information without redundancy
- **Currency**: Keep documentation up-to-date with code changes

## Structure

### File Organization

- **Getting Started**: Setup and installation guides
- **Setup**: Configuration guides for external services
- **Architecture**: Technical documentation
- **Development**: Developer-focused documentation
- **Infrastructure**: DevOps and infrastructure documentation

### File Naming

- Use `UPPERCASE.md` for main documentation files
- Use descriptive names: `INSTALLATION.md`, `CONFIGURATION.md`
- Use lowercase for guides: `guides/rich-text-editor.md`
- Avoid dates in filenames

## Formatting

### Headers

- Use `#` for main title (one per file)
- Use `##` for major sections
- Use `###` for subsections
- Use `####` for sub-subsections
- Don't skip header levels (don't go from `##` to `####`)

### Emphasis

- Use `**bold**` for important terms and concepts
- Use `*italic*` for emphasis (use sparingly)
- Use `` `code` `` for inline code, file names, and technical terms
- Use `> blockquote` for notes, warnings, or callouts

### Lists

- Use `-` for unordered lists
- Use `1.` for ordered lists
- Indent nested lists with 2 spaces
- Add blank lines before and after lists

### Code Blocks

- Use fenced code blocks with language specification:
  ````markdown
  ```typescript
  // Code here
  ```
  ````
- Use `bash` for shell commands
- Use `typescript` for TypeScript code
- Use `sql` for SQL queries
- Include relevant context in code comments

### Tables

- Use markdown tables for structured data
- Align columns appropriately
- Keep tables concise

### Links

- Use relative paths for internal documentation links
- Use descriptive link text, not "click here"
- Format: `[Description](path/to/file.md)`
- Verify all links work

## Content Guidelines

### Writing Style

- Write in active voice when possible
- Be concise but complete
- Use present tense for current features
- Use future tense for planned features
- Avoid jargon; define technical terms on first use

### Documentation Sections

#### Title
- Single `#` header with project/feature name
- Brief description (optional)

#### Overview
- What the feature/service does
- When to use it
- Key concepts

#### Prerequisites
- Required knowledge
- Required tools/software
- Required accounts/services

#### Step-by-Step Instructions
- Numbered steps for sequential processes
- Clear action items
- Expected outcomes

#### Examples
- Practical, real-world examples
- Complete code snippets when possible
- Multiple examples for complex features

#### Troubleshooting
- Common issues and solutions
- Error messages and fixes
- Related documentation links

### Status Indicators

Use emoji indicators consistently:
- ✅ Complete/Working
- 🚧 In Progress
- 📋 Planned
- ⚠️ Warning/Important Note
- ❌ Deprecated/Removed

## Language and Tone

- **Professional but friendly**: Avoid overly formal language
- **Direct**: Get to the point quickly
- **Inclusive**: Use inclusive language
- **Consistent**: Use the same terms throughout

## Technical Documentation

### Code Examples

- Include complete, working examples
- Add comments explaining non-obvious parts
- Show both simple and advanced use cases
- Include error handling when relevant

### API Documentation

- Document all parameters
- Include request/response examples
- Document error responses
- Include authentication requirements

### Database Documentation

- Reference `supabase/database_dump.sql` as source of truth
- Document table relationships
- Include relevant indexes
- Document RLS policies

## Maintenance

### Updating Documentation

- Update documentation when code changes
- Remove outdated information
- Add new features to appropriate sections
- Update examples to match current code

### Review Process

- Review for accuracy
- Check all links
- Verify code examples work
- Ensure consistency with style guide

## Common Patterns

### Installation Guides

```markdown
## Prerequisites

- List requirements
- Link to installation guides

## Installation Steps

1. First step
2. Second step

## Verification

How to verify installation worked
```

### Configuration Guides

```markdown
## Overview

What this configuration does

## Required Settings

| Variable | Description | Example |
|----------|-------------|---------|
| VAR_NAME | What it does | `value` |

## Optional Settings

Optional configuration options
```

### Feature Documentation

```markdown
## Overview

What the feature does

## Features

- Feature list
- Key capabilities

## Usage

How to use the feature

## Examples

Practical examples
```

## Do's and Don'ts

### Do

- ✅ Write clear, concise documentation
- ✅ Keep documentation up-to-date
- ✅ Use consistent formatting
- ✅ Include examples
- ✅ Link to related documentation
- ✅ Use proper markdown syntax

### Don't

- ❌ Include dates in documentation (use git history)
- ❌ Duplicate information unnecessarily
- ❌ Use ambiguous language
- ❌ Include outdated examples
- ❌ Use broken links
- ❌ Write overly long paragraphs

## Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [Technical Writing Guidelines](https://developers.google.com/tech-writing)
- [Semantic Versioning](https://semver.org/)

---

**Note**: This style guide is a living document. Update it as patterns emerge and standards evolve.

