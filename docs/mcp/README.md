# TeamPulse MCP Servers

MCP (Model Context Protocol) servers to enhance TeamPulse development experience with Claude.

## 📦 Available MCPs

### 1. Database Schema MCP (`@team-pulse/mcp-database`)

Provides access to database schema, tables, relationships, and migrations.

**Tools**:
- `get-database-schema` - Get complete database schema
- `get-table-schema` - Get detailed information about a specific table
- `get-migrations-history` - Get migration history
- `explain-schema-relationships` - Explain relationships between tables

[View full documentation →](./packages/mcp-database/README.md)

### 2. Testing Tools MCP (`@team-pulse/mcp-testing`)

Run tests, get coverage reports, and query testing patterns.

**Tools**:
- `run-tests` - Execute tests
- `get-test-coverage` - Get test coverage reports
- `get-test-patterns` - Query testing patterns
- `lint-check` - Run lint checks

[View full documentation →](./packages/mcp-testing/README.md)

## 🚀 Quick Setup

### 1. Build all MCPs

```bash
pnpm mcp:build
```

### 2. Configure Claude CLI (Recommended)

Add MCPs to Claude CLI (works in VS Code and terminal):

```bash
cd /path/to/team-pulse
claude mcp add --transport stdio team-pulse-database -- node packages/mcp-database/dist/index.js
claude mcp add --transport stdio team-pulse-testing -- node packages/mcp-testing/dist/index.js
```

Verify installation:
```bash
claude mcp list
```

### 3. Use MCPs

```bash
# Start chat with MCPs
claude chat

# Or ask directly
claude "What tables does my database have?"
claude "Run the API tests"
```

### Alternative: Claude Desktop

If using Claude Desktop app, edit the configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "team-pulse-database": {
      "command": "node",
      "args": [
        "/ABSOLUTE_PATH/team-pulse/packages/mcp-database/dist/index.js"
      ]
    },
    "team-pulse-testing": {
      "command": "node",
      "args": [
        "/ABSOLUTE_PATH/team-pulse/packages/mcp-testing/dist/index.js"
      ]
    }
  }
}
```

**⚠️ Important**: Replace `/ABSOLUTE_PATH/` with your project's absolute path.

To get the absolute path:
```bash
pwd
# Output: /Users/username/projects/team-pulse
```

Then restart Claude Desktop completely.

## 💡 Usage Examples

### Development with database context

```
👤 "I need to create a Player entity with name, age, and teamId"

🤖 Claude:
[uses get-database-schema to see current structure]
[uses get-table-schema with tableName="teams" to see relationships]
[suggests implementation following hexagonal architecture]
[generates migration compatible with schema]
```

### Testing during development

```
👤 "Add tests for CreatePlayerUseCase"

🤖 Claude:
[uses get-test-patterns to see conventions]
[generates tests following patterns]
[uses run-tests to verify they pass]
```

### Debugging with context

```
👤 "API tests are failing"

🤖 Claude:
[uses run-tests with package="api"]
[analyzes errors]
[uses get-table-schema if DB error]
[suggests fixes]
```

## 🔧 MCP Development

### Build in watch mode

```bash
pnpm mcp:dev
```

### Available scripts

```bash
# Build all MCPs
pnpm mcp:build

# Build in watch mode
pnpm mcp:dev

# Build specific MCP
cd packages/mcp-database && pnpm build
cd packages/mcp-testing && pnpm build
```

## 🎯 Benefits

### Database MCP
- ✅ Claude knows your schema without explanations
- ✅ Code suggestions compatible with your DB
- ✅ Automatic query validation
- ✅ Always up-to-date documentation

### Testing MCP
- ✅ Tests in conversation flow
- ✅ Immediate feedback on changes
- ✅ Automatic pattern following
- ✅ Real-time coverage verification

## 📚 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude CLI Documentation](https://docs.anthropic.com/en/docs/build-with-claude/claude-cli)
- [MCP Servers GitHub](https://github.com/modelcontextprotocol/servers)

## 🐛 Troubleshooting

### Claude doesn't see MCPs

**For Claude CLI:**
```bash
# List configured MCPs
claude mcp list

# Check if they're connected
# Should show ✓ Connected
```

**For Claude Desktop:**
1. Verify path in `claude_desktop_config.json` is absolute
2. Ensure MCPs are built (`pnpm mcp:build`)
3. Restart Claude Desktop completely (Cmd+Q on macOS)
4. Check logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

### Compilation errors

```bash
# Clean and rebuild
cd packages/mcp-database && pnpm clean && pnpm build
cd packages/mcp-testing && pnpm clean && pnpm build
```

### Tests won't run

Verify dependencies are installed:
```bash
pnpm install
```

### Remove MCP from CLI

```bash
claude mcp remove team-pulse-database
claude mcp remove team-pulse-testing
```

## 🚧 Future MCPs

Other MCPs that could be useful:

- **Code Architecture MCP** - Validate hexagonal architecture
- **API Documentation MCP** - Interactive endpoint documentation
- **Metrics MCP** - Analyze metrics and logs
- **DB Operations MCP** - Safe database operations

Interested in any? Open an issue or contribute! 🎉
