# CI/CD Pipeline Setup Investigation

**Status:** 📋 Investigation & Planning  
**Priority:** Medium  
**Estimated Setup Time:** 2-4 hours for basic setup, 4-6 hours for full pipeline

## Overview

This document investigates CI/CD pipeline options for the DLWait/DocHub project and provides recommendations for a basic, viable setup that's not too hard to implement and maintain.

## Current State

- ✅ **Repository:** GitHub (StiensWout/DLWait)
- ✅ **Project Type:** Next.js 14 + TypeScript
- ✅ **Test Framework:** Jest with coverage reporting
- ✅ **Package Manager:** Bun (primary), npm/node (fallback)
- ✅ **Current CI/CD:** None (manual deployments)
- ✅ **Code Review Tools:** CodeRabbit (manual reviews)

## Recommended Solution: GitHub Actions (Easy & Viable)

### Why GitHub Actions?

1. **Zero Setup Cost** - Already using GitHub, no additional services needed
2. **Free Tier** - 2,000 minutes/month free for private repos
3. **Native Integration** - Built into GitHub, no external accounts
4. **Easy Configuration** - YAML-based, simple syntax
5. **Great Documentation** - Extensive examples and community support
6. **Matrix Testing** - Easy to test multiple Node.js versions

### Complexity Assessment

| Task | Difficulty | Time | Value |
|------|-----------|------|-------|
| Basic CI (lint + test) | ⭐ Easy | 30 min | High |
| Test Coverage Reports | ⭐⭐ Easy-Medium | 1 hour | High |
| Build Verification | ⭐⭐ Easy-Medium | 30 min | High |
| TypeScript Type Checking | ⭐ Easy | 15 min | Medium |
| GitGuardian Secrets Scanning | ⭐ Easy | 15 min | High |
| Cursor Bugbot Integration | ⭐ Easy | 15 min | Medium-High |
| CodeRabbit Setup | ⭐ Easy | 10 min | Medium |
| Automated Deployment | ⭐⭐⭐ Medium | 2-3 hours | Medium |
| Coverage Badges | ⭐ Easy | 30 min | Low-Medium |

## Recommended Pipeline Stages

### Phase 1: Basic CI (Start Here) ✅ Easy

**What it does:**
- Runs on every PR and push to main
- Lints code
- Runs tests
- Type checks TypeScript

**Time to implement:** 30-45 minutes  
**Value:** High - Catches issues before merge

**Workflow file:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Run tests
        run: npm test
```

### Phase 2: Test Coverage (Recommended) ✅ Easy-Medium

**What it does:**
- Everything from Phase 1
- Generates coverage reports
- Uploads coverage to GitHub Actions artifacts
- Optionally: Posts coverage comment on PRs

**Time to implement:** 1 hour  
**Value:** High - Tracks test coverage trends

**Workflow file:** `.github/workflows/ci.yml` (enhanced)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30
      
      # Optional: Comment coverage on PRs
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          lcov-file: ./coverage/lcov.info
```

### Phase 3: Build Verification ✅ Easy-Medium

**What it does:**
- Everything from Phase 2
- Verifies the app builds successfully
- Catches build-time errors before merge

**Time to implement:** 30 minutes  
**Value:** High - Ensures deployment readiness

**Additional step:**

```yaml
      - name: Build application
        run: npm run build
        env:
          # Minimal env vars for build (can be dummy values)
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'dummy' }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy' }}
```

### Phase 4: Security & Code Quality Tools ✅ Easy

**What it does:**
- Scans for secrets and credentials (GitGuardian)
- Automated code review for bugs and security issues (Cursor Bugbot)
- Manual code review integration (CodeRabbit - already in use)

**Time to implement:** 30-45 minutes  
**Value:** High - Prevents security issues and improves code quality

#### 4a. GitGuardian Secrets Scanning

**Setup Steps:**

1. **Install GitGuardian GitHub App:**
   - Visit [GitGuardian GitHub App](https://github.com/apps/gitguardian)
   - Click "Install" and authorize access to repository
   - Select repository: `StiensWout/DLWait`

2. **Configure Monitoring:**
   - GitGuardian automatically scans commits and PRs for secrets
   - Free tier: Up to 25 developers, unlimited scans
   - Alerts appear directly in GitHub PRs

3. **Optional: Local Pre-commit Hook**
   - Install `ggshield` CLI: `pip install ggshield`
   - Add to `.pre-commit-config.yaml`:
   ```yaml
   - repo: https://github.com/GitGuardian/ggshield
     rev: v1.12.0
     hooks:
       - id: ggshield
   ```

**Benefits:**
- ✅ Prevents API keys, tokens, passwords from being committed
- ✅ Scans entire repository history
- ✅ Free tier covers small teams
- ✅ Zero configuration needed after install

**Workflow Integration (Optional):**

Add to `.github/workflows/ci.yml`:

```yaml
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: GitGuardian Secrets Scan
        uses: GitGuardian/ggshield-action@master
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

**Note:** GitHub App integration is simpler and doesn't require API key setup.

#### 4b. Cursor Bugbot Integration

**Setup Steps:**

1. **Access Cursor Dashboard:**
   - Go to [Cursor Dashboard](https://cursor.com/dashboard)
   - Sign in or create account

2. **Connect GitHub:**
   - Navigate to "Bugbot" tab
   - Click "Connect GitHub"
   - Authorize Cursor to access repositories

3. **Enable Bugbot:**
   - Select repository: `StiensWout/DLWait`
   - Enable automatic reviews on PRs

4. **Configure Preferences (Optional):**
   - Set to run automatically on all PRs
   - Or set to run only when mentioned (`@cursor-bugbot`)
   - Choose to hide "No Bugs Found" comments

**Benefits:**
- ✅ Automated bug detection in PRs
- ✅ Security issue identification
- ✅ Code quality suggestions
- ✅ Free tier available (14-day trial, then limited PRs/month)

**How It Works:**
- Automatically reviews pull requests
- Comments on PRs with findings
- Identifies bugs, security issues, and code smells
- No workflow file needed - works via GitHub App integration

#### 4c. CodeRabbit Manual Reviews (Already Configured)

**Current Setup:**
- ✅ CodeRabbit integration already in use
- ✅ Manual review workflow established

**Best Practices:**
- Assign reviewers for each PR
- Use CodeRabbit's review interface for thorough code examination
- Combine with automated tools (GitGuardian + Bugbot) for comprehensive coverage

**Workflow:**
1. Create PR → Automated tools scan (GitGuardian + Bugbot)
2. Assign manual reviewers via CodeRabbit
3. Review findings from all tools
4. Address issues before merge

### Phase 5: Deployment (Optional) ⚠️ Medium Complexity

**Options:**

#### Option A: Vercel (Recommended for Next.js)
- **Difficulty:** ⭐⭐ Easy-Medium
- **Time:** 1 hour
- **Setup:** Connect GitHub repo to Vercel, auto-deploys on push
- **Pros:** Zero config, automatic, free tier
- **Cons:** Vendor lock-in

#### Option B: GitHub Actions Deploy
- **Difficulty:** ⭐⭐⭐ Medium
- **Time:** 2-3 hours
- **Setup:** Configure deployment secrets, add deploy job
- **Pros:** Full control, no vendor lock-in
- **Cons:** More complex, need hosting provider

**Not Recommended (Too Complex):**
- Self-hosted runners
- Kubernetes deployments
- Multi-environment pipelines (dev/staging/prod)

## Implementation Plan

### Step 1: Create Basic CI (30 min)
1. Create `.github/workflows/ci.yml`
2. Add basic lint + test job
3. Test on a PR
4. **Stop here if you want minimal setup**

### Step 2: Add Coverage (30 min more)
1. Update workflow to include coverage
2. Add artifact upload
3. Test coverage generation
4. **Good stopping point for most projects**

### Step 3: Add Build Check (30 min more)
1. Add build step
2. Configure minimal env vars in GitHub Secrets
3. Test build succeeds

### Step 4: Add Security & Code Quality Tools (30-45 min)
1. Install GitGuardian GitHub App (15 min)
   - Visit GitHub App page and install
   - Configure repository access
   - Test with a PR containing a test secret
2. Set up Cursor Bugbot (15 min)
   - Connect GitHub account
   - Enable for repository
   - Configure preferences
3. Verify CodeRabbit integration (10 min)
   - Confirm manual review workflow
   - Test reviewer assignment

### Step 5: Add Deployment (2-3 hours, optional)
1. Choose deployment target (Vercel recommended)
2. Configure secrets
3. Add deploy job or use Vercel integration
4. Test end-to-end

## GitHub Secrets Needed

For build verification (Phase 3+), add these in GitHub Settings → Secrets:

```
NEXT_PUBLIC_SUPABASE_URL (optional, can use dummy for build)
NEXT_PUBLIC_SUPABASE_ANON_KEY (optional, can use dummy for build)
```

For GitGuardian GitHub Actions integration (optional):
```
GITGUARDIAN_API_KEY (only if using workflow integration, not needed for GitHub App)
```

For actual deployment, you'll need:
- All Supabase keys
- WorkOS keys (if using)
- Any other env vars your app needs

## Alternative CI/CD Options (Not Recommended)

### GitLab CI
- **Why not:** You're on GitHub, would need to migrate
- **Complexity:** Similar to GitHub Actions
- **Verdict:** Stick with GitHub Actions

### CircleCI
- **Why not:** Additional service to manage
- **Complexity:** Medium
- **Verdict:** GitHub Actions is simpler and free

### Jenkins
- **Why not:** Overkill for this project
- **Complexity:** High (self-hosted)
- **Verdict:** Too complex, not needed

### GitHub Actions with Self-Hosted Runners
- **Why not:** Unnecessary complexity
- **Complexity:** High (maintenance burden)
- **Verdict:** GitHub-hosted runners are fine

## What's Easy and Viable ✅

1. **Basic CI Pipeline** - Very easy, high value
2. **Test Coverage Reporting** - Easy, high value
3. **Build Verification** - Easy-medium, high value
4. **GitGuardian Secrets Scanning** - Easy, high value (15 min setup)
5. **Cursor Bugbot** - Easy, medium-high value (15 min setup)
6. **CodeRabbit Manual Reviews** - Already configured ✅
7. **Vercel Deployment** - Easy-medium, medium value

## What's NOT Easy (Avoid for Now) ❌

1. **Multi-environment pipelines** (dev/staging/prod) - Complex, not needed yet
2. **Self-hosted runners** - Maintenance burden
3. **Docker builds** - Unnecessary complexity
4. **Kubernetes deployments** - Overkill
5. **Complex matrix testing** - Can add later if needed

## Testing the Pipeline

After creating the workflow:

1. **Create a test PR** with a small change
2. **Watch the Actions tab** to see it run
3. **Verify all steps pass**
4. **Check coverage artifacts** (if Phase 2+)
5. **Merge PR** and verify main branch pipeline runs

## Monitoring & Maintenance

### What to Monitor:
- Pipeline success rate (should be >95%)
- Test execution time (keep under 5 min)
- Coverage trends (aim to maintain/increase)

### Maintenance:
- **Monthly:** Review and update action versions
- **Quarterly:** Review pipeline performance
- **When needed:** Add new steps as project grows

## Cost Considerations

### GitHub Actions (Free Tier)
- **2,000 minutes/month** free for private repos
- **Estimated usage:** ~10-20 minutes per PR
- **Can handle:** ~100-200 PRs/month
- **Verdict:** More than enough for this project

### GitGuardian (Free Tier)
- **Up to 25 developers** free
- **Unlimited scans** and alerts
- **GitHub App integration** free
- **Verdict:** Perfect for this project size

### Cursor Bugbot (Free Tier)
- **14-day free trial** initially
- **Limited PR reviews/month** after trial
- **Verdict:** Good for testing, may need paid plan for heavy usage

### CodeRabbit (Current Setup)
- **Manual review tool** - already in use
- **Cost:** Depends on plan (verify current subscription)
- **Verdict:** Already configured ✅

### Vercel (Free Tier)
- **100GB bandwidth/month**
- **Unlimited deployments**
- **Verdict:** Perfect for this project

## Next Steps

1. ✅ **Review this document** - Confirm approach
2. ⏳ **Create basic CI workflow** - Start with Phase 1
3. ⏳ **Test on a PR** - Verify it works
4. ⏳ **Add coverage** - Phase 2 if desired
5. ⏳ **Add build check** - Phase 3 if desired
6. ⏳ **Set up security tools** - Phase 4 (GitGuardian + Bugbot)
7. ⏳ **Verify CodeRabbit** - Confirm manual review workflow
8. ⏳ **Consider deployment** - Phase 5 if needed

## Questions to Answer Before Implementation

- [ ] Do we want automatic deployments or manual?
- [ ] Do we need coverage reports on PRs?
- [ ] Should we test on multiple Node.js versions?
- [ ] Do we need build verification or just tests?
- [ ] Where do we want to deploy? (Vercel, VPS, etc.)
- [x] **GitGuardian** - Set up for secrets scanning? ✅ Recommended
- [x] **Cursor Bugbot** - Set up for automated reviews? ✅ Recommended
- [x] **CodeRabbit** - Manual reviews already configured? ✅ Yes

## Resources

### CI/CD
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js GitHub Actions Example](https://github.com/vercel/next.js/tree/canary/examples/with-github-actions)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)

### Security & Code Quality
- [GitGuardian GitHub App](https://github.com/apps/gitguardian)
- [GitGuardian Documentation](https://docs.gitguardian.com/platform/user-account/plan-usage)
- [GitGuardian Free Tier](https://www.gitguardian.com/pricing)
- [Cursor Bugbot Documentation](https://docs.cursor.com/en/bugbot)
- [Cursor Dashboard](https://cursor.com/dashboard)
- [CodeRabbit Website](https://coderabbit.ai/)

---

**Created:** 2024  
**Last Updated:** 2024  
**Status:** Ready for Implementation

