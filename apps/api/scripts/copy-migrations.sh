#!/bin/bash
# Copy migration files to the dist directory after TypeScript compilation
# This ensures migrations are available in production builds

echo "📦 Copying migration files to dist..."

# Create the drizzle directory in dist if it doesn't exist
mkdir -p dist/drizzle/meta

# Copy all SQL and JSON files from drizzle to dist/drizzle
cp -r drizzle/*.sql dist/drizzle/ 2>/dev/null || true
cp -r drizzle/meta/*.json dist/drizzle/meta/ 2>/dev/null || true

echo "✅ Migration files copied successfully"
