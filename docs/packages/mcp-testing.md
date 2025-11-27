# TeamPulse Testing MCP

MCP Server that provides tools to run tests, get coverage reports, and query testing patterns for the TeamPulse project.

## 🎯 Features

### Available Tools

1. **`run-tests`** - Execute tests for a specific package or all
   - Parameters:
     - `package`: `"api"` | `"web"` | `"shared"` | `"all"` (default: `"all"`)
     - `filter`: optional filter for specific tests

2. **`get-test-coverage`** - Get test coverage report
   - Parameters:
     - `package`: `"api"` | `"web"` | `"shared"` (required)

3. **`get-test-patterns`** - Get information about testing patterns
   - Parameters:
     - `category`: `"all"` | `"unit-tests"` | `"integration-tests"` | `"test-data"` | `"mocking"` (default: `"all"`)

4. **`lint-check`** - Run lint checks
   - Parameters:
     - `package`: `"api"` | `"web"` | `"shared"` | `"all"` (default: `"all"`)
     - `fix`: `boolean` - automatically fix issues (default: `false`)

## 🚀 Setup

### 1. Build the MCP

```bash
cd packages/mcp-testing
pnpm build
```

### 2. Configure in Claude CLI

Add MCP to Claude CLI:

```bash
cd /path/to/team-pulse
claude mcp add --transport stdio team-pulse-testing -- node packages/mcp-testing/dist/index.js
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
    "team-pulse-testing": {
      "command": "node",
      "args": [
        "/absolute/path/to/team-pulse/packages/mcp-testing/dist/index.js"
      ]
    }
  }
}
```

**Important**: Adjust the absolute path according to your system.

Then restart Claude Desktop completely.

## 💡 Use Cases

### Run tests while developing

```
User: "Run the API tests"
Claude: [uses run-tests with package="api"]
```

### Check coverage

```
User: "What's the test coverage for the web package?"
Claude: [uses get-test-coverage with package="web"]
```

### Query testing patterns

```
User: "How are integration tests done here?"
Claude: [uses get-test-patterns with category="integration-tests"]
```

### Run lint

```
User: "Check the project's lint"
Claude: [uses lint-check with package="all"]
```

### Run specific tests

```
User: "Run only the CreateUserUseCase tests"
Claude: [uses run-tests with package="api" and filter="CreateUserUseCase"]
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
mcp-testing/
├── src/
│   └── index.ts       # MCP Server
├── dist/              # Compiled code
├── package.json
├── tsconfig.json
└── README.md
```

## 🎓 Benefits

- **Testing in context**: Run tests without leaving the conversation
- **Immediate feedback**: See test results while developing
- **Pattern guidance**: Claude knows your testing conventions
- **Continuous validation**: Verify changes don't break existing tests
- **Code quality**: Lint checks integrated in the workflow

## ⚠️ Notes

- Tests run in the complete workspace context
- Paths are relative to the monorepo root directory
- Requires project dependencies to be installed
