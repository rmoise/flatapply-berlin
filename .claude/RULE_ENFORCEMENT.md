# CLAUDE.md Rule Enforcement System

## 🎯 Overview

This system enforces your CLAUDE.md principles automatically by **blocking** non-compliant code before it's written.

## 🚀 How It Works

1. **Intercepts Code Changes**: The `claude-rules-enforcer.sh` hook runs before any Edit/Write/MultiEdit operation
2. **Validates Against Rules**: Checks your code against all CLAUDE.md principles
3. **Blocks Violations**: Prevents non-compliant code from being written
4. **Provides Feedback**: Tells you exactly what's wrong and how to fix it

## 📋 Rules Enforced

### 1. Context7 Documentation Check
- Detects when you're using libraries (Next.js, React, Tailwind, etc.)
- Blocks if Context7 wasn't consulted in the last 5 minutes
- Fix: Use `mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs`

### 2. No Hacks Rule
- Blocks workarounds, TODOs marked as hacks, band-aid solutions
- Detects: `setTimeout(0)`, `!important`, `any` types, `@ts-ignore`, empty catch blocks
- Fix: Address the root cause properly

### 3. Simplicity Check
- Blocks unnecessary state management libraries (Redux, MobX, etc.)
- Prevents API routes when Server Actions would work
- Flags unnecessary 'use client' directives
- Fix: Use simpler, built-in solutions

### 4. Architecture Compliance
- Ensures files are in correct locations
- Server Actions → `features/[feature]/actions.ts`
- Hooks → `features/[feature]/hooks/` or `src/hooks/`
- Components → proper directories
- Fix: Move files to correct locations

## 🛠️ Configuration

The hook is configured in `.claude/settings.json` and runs automatically.

### Marking Context7 as Checked
When you use Context7 tools, the hook automatically marks it as checked for 5 minutes:
```bash
# This happens automatically when you use:
mcp__context7__resolve-library-id
mcp__context7__get-library-docs
```

### Debug Mode
Enable debug logging:
```bash
export CLAUDE_DEBUG=1
```

## 📝 Examples

### ❌ Code that will be BLOCKED:
```typescript
'use client' // Unnecessary

import { useState } from 'react' // No Context7 check

export default function Component() {
  const [data, setData] = useState<any>() // 'any' type
  
  // TODO: hack - fix later
  setTimeout(() => {}, 0) // Hack pattern
  
  try {
    doSomething()
  } catch {} // Empty catch
}
```

### ✅ Code that will PASS:
```typescript
// After checking Context7 docs
import { Button } from '@/components/ui/button'

interface UserData {
  id: string
  name: string
}

export default function UserList({ users }: { users: UserData[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## 🧪 Testing

Run the test script to see the enforcement in action:
```bash
./.claude/test-rule-enforcement.sh
```

## 💡 Tips

1. **Check Context7 First**: Always look up documentation before using libraries
2. **Think Simple**: Ask "Is there a simpler way?" before adding complexity
3. **Fix Root Causes**: Don't work around problems, solve them
4. **Follow Architecture**: Put files where they belong

The hook ensures you follow these principles by making it impossible to write non-compliant code!