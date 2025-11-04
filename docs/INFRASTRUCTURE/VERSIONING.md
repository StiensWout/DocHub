# Versioning System

## Overview

DocHub uses Semantic Versioning (SemVer) to manage releases and track changes across the application.

## Version Format

We follow the [Semantic Versioning 2.0.0](https://semver.org/) specification:

**MAJOR.MINOR.PATCH** (e.g., `1.2.3`)

- **MAJOR** version: Incremented for incompatible API changes or major feature rewrites
- **MINOR** version: Incremented for new functionality added in a backward-compatible manner
- **PATCH** version: Incremented for backward-compatible bug fixes

### Pre-release Versions

- **Alpha** (`1.0.0-alpha.1`): Early development, may contain bugs
- **Beta** (`1.0.0-beta.1`): Feature complete, testing phase
- **RC** (`1.0.0-rc.1`): Release candidate, final testing before stable release

## Current Version

The current version is maintained in `package.json`:
- **Version**: `0.1.0` (Initial development phase)

## Version Strategy

### Version Progression

1. **0.x.x** (Current): Development phase
   - Breaking changes and new features are allowed
   - No stability guarantees

2. **1.0.0**: First stable release
   - All core features implemented
   - API stability commitment begins
   - Production-ready

3. **1.x.x**: Stable releases
   - Minor versions: New features, backward compatible
   - Patch versions: Bug fixes only

## Versioning Rules

### When to Increment MAJOR

- Breaking API changes
- Major architectural changes
- Incompatible database migrations
- Removal of deprecated features

### When to Increment MINOR

- New features added
- New API endpoints
- New configuration options
- Enhancements to existing features

### When to Increment PATCH

- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

## Version Display

The version is displayed in multiple locations:

1. **Application UI**: Footer component (always visible)
2. **Admin/Settings**: Version information panel
3. **API Responses**: Optional version header (`X-API-Version`)
4. **Debug Panel**: Full version details for developers

## Release Process

### Release Workflow

1. **Feature Development**: Work on feature branches
2. **Testing**: Ensure all tests pass, CI pipeline succeeds
3. **Version Bump**: Update version in `package.json`
4. **Changelog**: Update `CHANGELOG.md` with changes
5. **Release PR**: Create pull request for release
6. **Review**: Code review and approval
7. **Merge**: Merge to `main` branch
8. **Tag**: Create git tag with version number
9. **Deploy**: Deploy to production

### Version Bump Process

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major

# For pre-releases
npm version prerelease --preid=alpha
npm version prerelease --preid=beta
npm version prerelease --preid=rc
```

## Changelog

All version changes are documented in `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.3] - 2025-11-04

### Added
- New feature X

### Changed
- Improved Y

### Fixed
- Bug fix Z

### Security
- Security patch
```

## Version Tags

Git tags are created for each release:

```bash
# Create tag
git tag -a v1.2.3 -m "Release version 1.2.3"

# Push tag
git push origin v1.2.3
```

## Version Priority

When multiple features are ready for release:

1. **Critical Security Patches**: Highest priority
2. **Critical Bug Fixes**: High priority
3. **Minor Features**: Medium priority
4. **Major Features**: Planned releases

## Related Documentation

- [Release Management](./RELEASE_MANAGEMENT.md)
- [Deployment Process](./DEPLOYMENT.md)
- [CI/CD Pipeline](../INFRASTRUCTURE/CI_CD_PIPELINE_SETUP.md)

