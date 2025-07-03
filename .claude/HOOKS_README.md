# Claude Code Hooks Documentation

## Overview

This project uses Claude Code hooks to automatically enforce the development principles defined in CLAUDE.md. These hooks run at specific points during Claude Code's operation to provide reminders, run checks, and ensure code quality.

## Installed Hooks

### 1. Context7 Documentation Check (`check-context7-usage.sh`)
- **Trigger**: Before editing/creating code files
- **Purpose**: Reminds to check Context7 documentation for libraries
- **Non-blocking**: Provides reminders but doesn't prevent operations

### 2. Code Quality Validation (`code-quality-check.sh`)
- **Trigger**: After editing TypeScript/JavaScript files
- **Purpose**: Runs TypeScript and ESLint checks automatically
- **Output**: Shows first 10 lines of any errors for quick review

### 3. Simple Solution Verification (`verify-simple-solution.sh`)
- **Trigger**: Before creating new files
- **Purpose**: Encourages checking existing utilities before creating new ones
- **Suggestions**: Provides context-aware hints based on file type

### 4. Security Check (`security-check.sh`)
- **Trigger**: After editing sensitive files (.env, config, auth-related)
- **Purpose**: Scans for potential exposed secrets
- **Patterns**: Checks for API keys, passwords, tokens, etc.

### 5. Architecture Compliance (`architecture-compliance.sh`)
- **Trigger**: When creating/editing files in src/
- **Purpose**: Ensures feature-based architecture is maintained
- **Guidance**: Provides reminders about correct file placement

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [...],  // Runs before tools
    "PostToolUse": [...]  // Runs after tools
  }
}
```

## Key Principles

All hooks follow CLAUDE.md principles:
- ✅ **Simple**: Straightforward bash scripts
- ✅ **No hacks**: Direct solutions, no workarounds
- ✅ **Non-blocking**: Inform but don't prevent work
- ✅ **Root cause**: Address fundamental issues

## Security Notes

- Hooks run with user permissions
- All paths use absolute references for security
- Scripts validate inputs and use proper quoting
- No modification of sensitive files

## Maintenance

To modify hooks:
1. Edit the script in `.claude/hooks/`
2. Ensure it remains executable (`chmod +x`)
3. Test the hook behavior
4. Update this documentation if needed

## Disabling Hooks

To temporarily disable hooks, rename or remove `.claude/settings.json`.