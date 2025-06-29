# CLAUDE.md - Development Guidelines for FlatApply Berlin MVP

## 🚨 CRITICAL RULES - MUST FOLLOW

### 1. ALWAYS Check Context7 Documentation FIRST
**Before implementing ANY feature or using ANY library:**
```
1. Use mcp__context7__resolve-library-id to find the library
2. Use mcp__context7__get-library-docs to read the documentation
3. Follow the EXACT patterns from the official docs
4. DO NOT guess or use outdated patterns
```

**Required Documentation Checks:**
- Next.js 15 - App Router, Server Components, Server Actions
- React 19 - useActionState, useFormStatus, useOptimistic
- Tailwind CSS 3.4+ - Latest utility classes
- Supabase - SSR, Auth, RLS policies
- shadcn/ui - Component patterns
- React Hook Form - Form handling
- Zod - Schema validation

**Why:** Documentation is the source of truth. Following it prevents bugs and ensures we use the latest, most efficient patterns.

### 2. NO HACKS - Fix the Root Cause
❌ **NEVER DO THIS:**
- Quick fixes that don't address the real problem
- Workarounds that add complexity
- Band-aid solutions
- Copy-pasting from StackOverflow without understanding

✅ **ALWAYS DO THIS:**
- Understand the root cause of issues
- Fix problems at their source
- Use proper, documented solutions
- Refactor if needed to do it right

### 3. Keep It Simple - Don't Over-Engineer
**Follow these principles:**
- Start with the simplest solution that works
- Only add complexity when proven necessary
- Use built-in features before adding libraries
- Write code that a junior dev can understand

**Examples:**
- ✅ Use Server Components (simple) instead of client-side state management
- ✅ Use Server Actions instead of separate API routes
- ✅ Use native HTML/CSS before reaching for libraries
- ❌ Don't add Redux/Zustand unless absolutely necessary

## 📋 Development Workflow

### Before Starting Any Task:
1. **Read the requirements** carefully
2. **Check Context7** for relevant documentation
3. **Plan the simplest approach** that meets the requirements
4. **Verify the approach** follows existing patterns in the codebase

### When Implementing:
1. **Follow DRY principles** - Don't Repeat Yourself
2. **Use existing utilities** before creating new ones
3. **Maintain consistency** with existing code patterns
4. **Add proper TypeScript types** - no `any` types
5. **Handle errors properly** - no silent failures

### After Implementation:
1. **Run TypeScript checks**: `npx tsc --noEmit`
2. **Run linter**: `npm run lint`
3. **Test the feature** manually
4. **Update documentation** if needed

## 🏗️ Architecture Principles

### 1. Feature-Based Structure
```
src/
├── features/           # Feature modules (auth, profile, etc.)
│   └── [feature]/
│       ├── actions.ts  # Server Actions
│       ├── components/ # Feature components
│       ├── hooks/      # Feature-specific hooks
│       └── types.ts    # Feature types
├── components/         # Shared UI components
├── lib/               # Utilities and configs
├── app/               # Next.js pages
└── types/             # Global TypeScript types
```

### 2. Server-First Approach
- **Default to Server Components** - Only use 'use client' when needed
- **Use Server Actions** for all mutations
- **Fetch data on the server** - Better performance and SEO
- **Progressive enhancement** - Works without JavaScript

### 3. Type Safety
- **Define all types** in TypeScript
- **Use generic types** for reusability
- **Avoid type assertions** unless absolutely necessary
- **Let TypeScript infer** when possible

## 🛠️ Technology Guidelines

### Next.js 15
- Use App Router (not Pages Router)
- Leverage Server Components
- Implement Server Actions for forms
- Use middleware for auth
- Enable Turbopack for development

### React 19
- Use `useActionState` for form state
- Use `useFormStatus` for loading states
- Use `useOptimistic` for optimistic updates
- Avoid deprecated patterns from React 18

### Tailwind CSS
- Always check latest documentation
- Use utility classes first
- Avoid arbitrary values when possible
- Follow mobile-first approach
- Use CSS variables for theming

### Supabase
- Always use SSR client for server-side
- Implement Row Level Security (RLS)
- Use proper error handling
- Keep service keys secret
- Follow auth best practices

### Styling
- Use Tailwind CSS utilities first
- Use shadcn/ui components
- Maintain consistent spacing
- Follow mobile-first approach
- Keep dark mode in mind

## ❌ Common Mistakes to Avoid

### 1. Authentication
❌ **Wrong:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login') // Repeated everywhere
```

✅ **Right:**
```typescript
const user = await requireAuth() // Centralized auth check
```

### 2. Form Handling
❌ **Wrong:**
```typescript
// Creating separate API routes for forms
// Using useState for form state
// Manual loading states
```

✅ **Right:**
```typescript
// Use Server Actions
// Use useActionState
// Use useFormStatus
```

### 3. Data Fetching
❌ **Wrong:**
```typescript
// Fetching in useEffect
// Client-side data fetching
// Not handling loading/error states
```

✅ **Right:**
```typescript
// Fetch in Server Components
// Use Suspense for loading
// Proper error boundaries
```

## 📚 Resources

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

### Project-Specific
- `/PRD.md` - Product requirements
- `/src/types/` - Type definitions
- `/src/lib/` - Shared utilities

## 🚀 Quick Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Type Checking
npx tsc --noEmit    # Check TypeScript

# Linting
npm run lint        # Run ESLint

# Building
npm run build       # Production build
npm start           # Start production server

# Database
supabase start      # Local Supabase
supabase db push    # Push migrations
```

## 🔒 Security Guidelines

1. **Never commit secrets** - Use .env.local
2. **Validate all inputs** - Server and client side
3. **Use RLS policies** - Database security
4. **Sanitize user content** - Prevent XSS
5. **Keep dependencies updated** - Security patches

## 📝 Code Review Checklist

Before submitting code:
- [ ] Checked Context7 documentation
- [ ] No hacks or workarounds
- [ ] Follows DRY principles
- [ ] TypeScript has no errors
- [ ] ESLint has no errors
- [ ] Code is simple and readable
- [ ] Proper error handling
- [ ] No console.logs left
- [ ] No commented code
- [ ] Documentation updated if needed

## 💡 Remember

> "The best code is no code at all. The second best is simple, documented code that solves the problem correctly."

Always ask yourself:
1. Is this the simplest solution?
2. Am I following the documentation?
3. Will another developer understand this?
4. Am I fixing the root cause?

When in doubt, check Context7 documentation!