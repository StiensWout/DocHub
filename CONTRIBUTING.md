# Contributing to DocHub

Thank you for your interest in contributing to DocHub! This guide will help you get started.

## 📋 Getting Started

1. **Read the Documentation**
   - Start with [Documentation Index](docs/INDEX.md)
   - Review [Development Guide](docs/DEVELOPMENT/GUIDE.md)
   - Check [Documentation Style Guide](docs/DEVELOPMENT/STYLE_GUIDE.md)

2. **Check the Roadmap**
   - See [Roadmap](docs/ROADMAP.md) for planned features
   - Review [GitHub Issues](https://github.com/StiensWout/DocHub/issues) for active work

3. **Set Up Development Environment**
   - Follow [Installation Guide](docs/GETTING_STARTED/INSTALLATION.md)
   - Configure [WorkOS Authentication](docs/SETUP/WORKOS.md)

## 🎯 How to Contribute

### Reporting Bugs

- Use [GitHub Issues](https://github.com/StiensWout/DocHub/issues) to report bugs
- Include:
  - Clear description of the issue
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, browser, Node version)
  - Screenshots if applicable

### Suggesting Features

- Open a [GitHub Issue](https://github.com/StiensWout/DocHub/issues) for feature requests
- Include:
  - Clear description of the feature
  - Use case or problem it solves
  - Potential implementation approach (if you have ideas)

### Code Contributions

1. **Find an Issue**
   - Check [GitHub Issues](https://github.com/StiensWout/DocHub/issues) for open tasks
   - Comment on issues you'd like to work on

2. **Create a Branch**
   - Create a feature branch: `feature/issue-XX-description`
   - Keep branches focused on a single feature or fix

3. **Make Changes**
   - Follow existing code style and patterns
   - Write clear, descriptive commit messages
   - Update documentation as needed

4. **Test Your Changes**
   - Run `bun run lint` to check for linting errors
   - Test manually in your development environment
   - See [Testing Guide](docs/DEVELOPMENT/TESTING.md) for testing practices

5. **Submit a Pull Request**
   - Reference the issue number in your PR description
   - Describe what changes you made and why
   - Wait for review and address feedback

## 📝 Code Style

- **TypeScript**: Follow existing type patterns
- **React**: Use functional components and hooks
- **Styling**: Use Tailwind CSS utility classes
- **Naming**: Use descriptive, camelCase names
- **Comments**: Add comments for complex logic

## 📚 Documentation

- Update relevant documentation when adding features
- Follow [Documentation Style Guide](docs/DEVELOPMENT/STYLE_GUIDE.md)
- Keep documentation clear and up-to-date
- Reference GitHub Issues for feature tracking

## 🗄️ Database Changes

- Schema changes should be documented in `supabase/database_dump.sql`
- See [Database Dump Guide](docs/INFRASTRUCTURE/DATABASE_DUMP.md)
- Update [Database Architecture](docs/ARCHITECTURE/DATABASE.md) if needed

## ✅ Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows existing style patterns
- [ ] All linting checks pass (`bun run lint`)
- [ ] Documentation updated (if needed)
- [ ] Changes tested manually
- [ ] Issue referenced in PR description
- [ ] Commit messages are clear and descriptive

## 🤝 Questions?

- Check [Documentation Index](docs/INDEX.md)
- Review [FAQ](docs/FAQ.md)
- Open a [GitHub Issue](https://github.com/StiensWout/DocHub/issues) for questions

Thank you for contributing to DocHub! 🙏

