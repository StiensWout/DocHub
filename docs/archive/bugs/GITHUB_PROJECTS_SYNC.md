# GitHub Projects Sync Guide

This guide explains how to sync your TODO items from `TODO.md` to GitHub Projects without creating them as traditional "bug" issues.

## 🎯 Overview

GitHub Projects primarily works with **Issues**, but you can distinguish task issues from bug issues using:
- **Labels** (e.g., `task`, `feature`, `optimization`, `infrastructure`)
- **Project Board** organization
- **Custom fields** (if using GitHub Projects Beta)

## 📋 Two Approaches

### Approach 1: Create Issues with Task Labels (Recommended)

This is the most practical approach. Create issues for each task but use labels to distinguish them from bugs.

#### Step 1: Create Labels

First, create labels in your GitHub repository:

```bash
# Infrastructure tasks
gh label create "task" --description "General project task" --color "0E8A16"
gh label create "infrastructure" --description "Infrastructure and DevOps tasks" --color "0052CC"
gh label create "optimization" --description "Performance optimization tasks" --color "FFD700"
gh label create "feature" --description "New feature implementation" --color "5319E7"
gh label create "rebranding" --description "Rebranding and migration tasks" --color "B60205"

# Priority labels (if not already created)
gh label create "priority-high" --description "High priority task" --color "B60205"
gh label create "priority-medium" --description "Medium priority task" --color "FBCA04"
gh label create "priority-low" --description "Low priority task" --color "0E8A16"
```

#### Step 2: Create Issues from TODO Items

For each major task in `TODO.md`, create a GitHub issue:

**Example: Infrastructure Task**

```bash
gh issue create \
  --title "Task #1: Upgrade Framework/Packages to Latest Versions" \
  --label "task,infrastructure,priority-medium" \
  --body-file - << 'EOF'
## Task #1: Upgrade Framework/Packages to Latest Versions

**Priority:** 🟡 MEDIUM  
**Category:** Infrastructure / Security  
**Files:** `package.json`, All dependencies

### Tasks
- [ ] Audit current package versions
- [ ] Create upgrade plan
- [ ] Upgrade packages incrementally
- [ ] Test all major features after upgrade

### Estimated Time
4-6 hours

### Risk Level
Medium - Requires thorough testing

---
*Created from TODO.md*
EOF
```

**Example: Performance Optimization**

```bash
gh issue create \
  --title "Perf #1: React Component Optimization" \
  --label "task,optimization" \
  --body-file - << 'EOF'
## Perf #1: React Component Optimization

**Files:** `components/*.tsx`

### Tasks
- [ ] Audit components for unnecessary re-renders
- [ ] Add `React.memo()` to expensive components
- [ ] Review `useCallback` usage
- [ ] Profile component render times

### Expected Impact
20-30% faster component renders

---
*Created from TODO.md*
EOF
```

#### Step 3: Add Issues to Project Board

After creating issues, add them to your GitHub Project board:

1. Go to your GitHub Project board
2. Click "Add item" → "Issue"
3. Select the issues you created
4. Drag them to appropriate columns (To Do, In Progress, etc.)

### Approach 2: Manual Project Board Items (Limited)

If you want to avoid creating issues entirely, you can:

1. Use GitHub Projects Beta (if available) with Draft items
2. Manually add items to your board as "Notes" (limited functionality)

**Note:** This approach has limited functionality compared to issues.

## 🤖 Automation Script

You can create a PowerShell script to automate issue creation from TODO.md:

### Script: `sync-todo-to-github.ps1`

```powershell
# Sync TODO.md tasks to GitHub Issues
# Usage: .\sync-todo-to-github.ps1

$todoFile = "bugs\TODO.md"
$content = Get-Content $todoFile -Raw

# Extract tasks (simplified example - you'll need to parse TODO.md properly)
# This is a basic structure - enhance based on your TODO.md format

Write-Host "This script would parse TODO.md and create GitHub issues..."
Write-Host "Manual creation recommended for now."

# Example: Create issue for Task #1
# gh issue create --title "Task #1: Upgrade Framework/Packages" --label "task,infrastructure" --body "..."

Write-Host "See GITHUB_PROJECTS_SYNC.md for manual instructions."
```

## 📝 Best Practices

### 1. Issue Naming Convention

- **Infrastructure:** `Task #N: [Description]`
- **Performance:** `Perf #N: [Description]`
- **Features:** `Feature: [Description]`
- **Rebranding:** `Rebranding: [Description]`

### 2. Label Strategy

Use consistent labels:
- `task` - All non-bug work items
- `bug` - Bug reports only
- `infrastructure`, `optimization`, `feature`, `rebranding` - Task categories
- `priority-high`, `priority-medium`, `priority-low` - Priority levels

### 3. Issue Body Template

Include in each issue:
- Task description from TODO.md
- Checklist items
- Estimated time
- Risk level
- Related files
- Link back to TODO.md section

### 4. Project Board Columns

Organize your board with columns like:
- 📋 **Backlog** - All tasks
- 🎯 **To Do** - Ready to start
- 🔄 **In Progress** - Currently working
- 👀 **Review** - Needs review
- ✅ **Done** - Completed

## 🔄 Sync Workflow

### Initial Sync (One-time)

1. Review `TODO.md` and identify all major tasks
2. Create issues for each task (use script or manual)
3. Add all issues to your GitHub Project board
4. Organize issues into appropriate columns

### Ongoing Maintenance

1. **Add New Tasks:**
   - Add to `TODO.md` first
   - Create GitHub issue with `task` label
   - Add to Project board

2. **Update Progress:**
   - Check off items in `TODO.md`
   - Update GitHub issue status
   - Move card in Project board

3. **Complete Tasks:**
   - Mark complete in `TODO.md`
   - Close GitHub issue
   - Move to "Done" column in Project board

## 🎨 Project Board Customization

### Custom Fields (Beta Projects)

If using GitHub Projects Beta, you can add custom fields:
- **Estimated Time** (Number)
- **Risk Level** (Single select: Low, Medium, High)
- **Category** (Single select: Infrastructure, Performance, Feature, etc.)

### Views

Create different views:
- **By Priority** - Group by priority labels
- **By Category** - Group by task type
- **By Assignee** - Group by who's working on it
- **Timeline** - See tasks on a timeline

## 📊 Example: Complete Task Creation

```bash
# Task #1: Upgrade Framework/Packages
gh issue create \
  --title "Task #1: Upgrade Framework/Packages to Latest Versions" \
  --label "task,infrastructure,priority-medium" \
  --body "$(cat << 'EOF'
## Task #1: Upgrade Framework/Packages to Latest Versions

**Priority:** 🟡 MEDIUM  
**Category:** Infrastructure / Security  
**Files:** `package.json`, All dependencies

### Tasks
- [ ] Audit current package versions
- [ ] Create upgrade plan
- [ ] Upgrade packages incrementally
- [ ] Test all major features after upgrade

### Estimated Time
4-6 hours

### Risk Level
Medium - Requires thorough testing

**Related:** [TODO.md](../bugs/TODO.md#task-1-upgrade-frameworkpackages-to-latest-versions)
EOF
)" \
  --assignee "@me"
```

## 🔗 Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Issues Documentation](https://docs.github.com/en/issues)

---

**Note:** While GitHub Projects primarily works with issues, using labels (`task` vs `bug`) allows you to clearly distinguish between bugs and tasks while still leveraging GitHub's powerful project management features.

