# Claude Code - Project Configuration

This directory contains Claude Code configuration for the TeamPulse project.

## Files

### `context.md`
Complete document with all architecture, conventions, tech stack, and project patterns. Claude automatically reads this file in every conversation to understand the project context.

### Custom Commands (`/commands`)

You can use these commands by typing `/command-name` in the conversation with Claude:

#### `/architecture`
Reviews current code verifying it respects:
- Hexagonal architecture
- DDD patterns
- Layer separation
- Correct naming

**Usage**: Type `/architecture` after creating or modifying code.

#### `/feature`
Interactive assistant to create a complete feature (backend + frontend + tests) following all project conventions.

**Usage**: Type `/feature` and answer the questions.

#### `/test`
Generates complete tests (unit, integration, E2E) for current code following project conventions.

**Usage**: Type `/test` when you need tests for your code.

#### `/refactor`
Refactors code while keeping tests passing and respecting architecture.

**Usage**: Type `/refactor` and specify what you want to refactor.

## Usage Example

```
User: I've created a new User entity but I'm not sure if it respects the architecture.

User: /architecture

Claude: [Analyzes code and provides architecture feedback]
```

## Benefits

✅ No need to repeat the same instructions every time
✅ Claude automatically knows the project architecture
✅ Quick commands for common tasks
✅ Consistency in all generated code

## More Information

- Claude Code Documentation: https://docs.claude.com/en/docs/claude-code
- Slash Commands: https://docs.claude.com/en/docs/claude-code/slash-commands
