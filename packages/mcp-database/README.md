# TeamPulse Database Schema MCP

MCP Server that provides access to TeamPulse database schema, allowing queries about tables, columns, relationships, and migrations.

## 🎯 Features

### Available Tools

1. **`get-database-schema`** - Get complete database schema
   - Parameters:
     - `format`: `"full"` | `"summary"` | `"tables-only"` (default: `"full"`)
   
2. **`get-table-schema`** - Get detailed information about a specific table
   - Parameters:
     - `tableName`: table name (required)

3. **`get-migrations-history`** - Get Drizzle migration history

4. **`explain-schema-relationships`** - Explain relationships between tables
   - Parameters:
     - `tableName`: specific table (optional)

## 🚀 Setup

### 1. Build the MCP

```bash
cd packages/mcp-database
pnpm build
```

### 2. Configure in Claude CLI

Add MCP to Claude CLI:

```bash
cd /path/to/team-pulse
claude mcp add --transport stdio team-pulse-database -- node packages/mcp-database/dist/index.js
```

Verify installation:
```bash
claude mcp list
```

### Alternative: Claude Desktop

Add to Claude configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "team-pulse-database": {
      "command": "node",
      "args": [
        "/absolute/path/to/team-pulse/packages/mcp-database/dist/index.js"
      ]
    }
  }
}
```

**Important**: Adjust the absolute path according to your system.

Then restart Claude Desktop completely.

## 💡 Use Cases

### Query complete schema

```
User: "What's the database schema?"
Claude: [uses get-database-schema with format="summary"]
```

### Get table information

```
User: "What columns does the users table have?"
Claude: [uses get-table-schema with tableName="users"]
```

### View relationships

```
User: "What relationships does the teams table have?"
Claude: [uses explain-schema-relationships with tableName="teams"]
```

### Query migrations

```
User: "What's the migration history?"
Claude: [uses get-migrations-history]
```

## 🔧 Development

```bash
# Build in watch mode
pnpm dev

# Format code
pnpm format

# Lint
pnpm lint
```

## 📁 Structure

```
mcp-database/
├── src/
│   └── index.ts       # MCP Server
├── dist/              # Compiled code
├── package.json
├── tsconfig.json
└── README.md
```

## 🎓 Benefits

- **Immediate context**: Claude knows your schema without explanations
- **Precise suggestions**: Can suggest changes based on current schema
- **Validation**: Verifies queries and changes are compatible
- **Living documentation**: Schema is always up to date
