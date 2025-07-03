#!/bin/bash

# Test script to verify CLAUDE.md rule enforcement

echo "🧪 Testing CLAUDE.md Rule Enforcement Hook"
echo "=========================================="
echo ""

# Test 1: Create a file with violations
echo "Test 1: Creating a file with multiple violations..."
cat > /tmp/test-violations.ts << 'EOF'
// This file intentionally violates CLAUDE.md rules for testing

'use client' // Violation: unnecessary client component

import { useState } from 'react' // No Context7 check
import axios from 'axios' // Should use native fetch

export default function TestComponent() {
  // TODO: hack - fix this later
  const [data, setData] = useState<any>() // Using 'any' type
  
  try {
    // Some code
  } catch (e) {
    // Empty catch block - error suppression
  }
  
  // Workaround for timing issue
  setTimeout(() => {
    console.log('hack')
  }, 0)
  
  return <div style={{ color: 'red !important' }}>Test</div>
}
EOF

echo "Created test file with violations at /tmp/test-violations.ts"
echo ""

# Test 2: Create a compliant file
echo "Test 2: Creating a compliant file..."
cat > /tmp/test-compliant.ts << 'EOF'
// This file follows CLAUDE.md rules

import { Button } from '@/components/ui/button'

interface UserData {
  id: string
  name: string
  email: string
}

export default function UserProfile({ user }: { user: UserData }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{user.name}</h1>
      <p className="text-gray-600">{user.email}</p>
      <Button>Edit Profile</Button>
    </div>
  )
}
EOF

echo "Created compliant file at /tmp/test-compliant.ts"
echo ""

# Test 3: Show how to mark Context7 as checked
echo "Test 3: Marking Context7 as checked..."
mkdir -p .claude/.cache
touch .claude/.cache/context7-checks.txt
echo "✅ Context7 cache created - library usage will now be allowed for 5 minutes"
echo ""

echo "🎯 How the hook works:"
echo "1. It intercepts Edit/Write/MultiEdit operations on code files"
echo "2. Validates against CLAUDE.md rules"
echo "3. BLOCKS the operation if violations are found"
echo "4. Provides specific feedback on how to fix issues"
echo ""
echo "Try editing the test files to see the hook in action!"