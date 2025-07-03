#!/bin/bash

# claude-rules-enforcer.sh
# Purpose: Enforce CLAUDE.md rules by blocking non-compliant code modifications
# Follows Claude Code hooks documentation

set -euo pipefail

# Read JSON input from stdin as per documentation
INPUT=$(cat)

# Extract information using jq
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
OLD_STRING=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
NEW_STRING=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')

# Only enforce on code-modifying tools
case "$TOOL_NAME" in
  "Edit"|"MultiEdit"|"Write")
    # Skip non-code files
    if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
      exit 0
    fi
    ;;
  *)
    # Allow all other tools
    exit 0
    ;;
esac

# Function to check for violations
check_violations() {
  local content="$1"
  local file_path="$2"
  local has_violations=false
  
  # Check for hacks and workarounds
  if echo "$content" | grep -qiE "TODO.*hack|HACK|FIXME.*later|workaround|band-aid"; then
    echo "Found hack/workaround patterns - fix the root cause instead"
    has_violations=true
  fi
  
  # Check for any types
  if echo "$content" | grep -qE ":\s*any\s*[;,)]|any\s*[;,]"; then
    echo "Found 'any' type - use proper TypeScript types"
    has_violations=true
  fi
  
  # Check for error suppression
  if echo "$content" | grep -qE "@ts-ignore|@ts-nocheck|eslint-disable"; then
    echo "Found error suppression - fix the underlying issue"
    has_violations=true
  fi
  
  # Check for empty catch blocks
  if echo "$content" | grep -qE "catch\s*\([^)]*\)\s*{\s*}"; then
    echo "Found empty catch block - handle errors properly"
    has_violations=true
  fi
  
  # Check for unnecessary client components
  if echo "$content" | grep -q "^'use client'" && ! echo "$content" | grep -qE "useState|useEffect|onClick|onChange"; then
    echo "Using 'use client' without interactive features - use Server Component instead"
    has_violations=true
  fi
  
  if [ "$has_violations" = true ]; then
    return 1
  fi
  return 0
}

# Get content to check
if [[ "$TOOL_NAME" == "Write" ]]; then
  CHECK_CONTENT="$CONTENT"
elif [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" ]]; then
  # For edits, check the new content
  CHECK_CONTENT="$NEW_STRING"
else
  CHECK_CONTENT=""
fi

# Run checks
if ! check_violations "$CHECK_CONTENT" "$FILE_PATH" 2>&1; then
  # Exit with code 2 to block the operation
  exit 2
fi

# Exit with 0 to allow the operation
exit 0