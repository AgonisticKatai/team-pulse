#!/bin/bash

# Script to validate that all TypeScript imports in shared package use .js extensions
# This is required for ESM compatibility in Node.js/Vercel serverless functions

set -e

SHARED_DIR="$(dirname "$0")/.."
ERROR_COUNT=0

echo "🔍 Validating ESM imports in shared package..."
echo ""

# Find all .ts files (excluding test files)
while IFS= read -r file; do
  # Check for imports/exports without .js extension
  # Matches: from './something' or from "../something"
  # Ignores: from 'zod' (external packages)
  if grep -n "from ['\"]\..*[^.js]['\"]" "$file" 2>/dev/null | grep -v "\.js['\"]"; then
    echo "❌ Found imports without .js extension in: $file"
    grep -n "from ['\"]\..*[^.js]['\"]" "$file" | grep -v "\.js['\"]"
    echo ""
    ((ERROR_COUNT++))
  fi
done < <(find "$SHARED_DIR/src" -name "*.ts" -not -name "*.test.ts")

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ Found $ERROR_COUNT file(s) with invalid imports"
  echo ""
  echo "📖 All relative imports must use .js extensions:"
  echo "   ✅ from './types/index.js'"
  echo "   ✅ from '../dtos/auth.dto.js'"
  echo "   ❌ from './types'"
  echo "   ❌ from '../dtos/auth.dto'"
  echo ""
  exit 1
else
  echo "✅ All imports are valid!"
  exit 0
fi
