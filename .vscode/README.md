# VSCode Workspace Configuration

This directory contains shared VSCode configuration for the Team Pulse project.

## 📁 Shared Files

### `settings.json` (Tracked by Git)
Workspace configuration that all team members should use:
- **Auto-formatting**: Biome formats code on save
- **Linting**: Biome checks code automatically
- **Tailwind CSS**: Support for `.css` files with Tailwind directives

> **⚠️ Important**: Do NOT add REST Client credentials to this file. They belong in your User Settings. See [`apps/api/http-client/README.md`](../../apps/api/http-client/README.md) for setup instructions.

### `extensions.json` (Tracked by Git)
Recommended extensions that VSCode will suggest automatically:

#### Required:
- **Biome** (`biomejs.biome`) - Project's linter and formatter
- **REST Client** (`humao.rest-client`) - API testing with `.http` files
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind autocomplete

#### Helpful:
- **Error Lens** (`usernamehw.errorlens`) - Shows errors inline

## 🚫 Files NOT Shared (Gitignored)

The following files are personal and not shared:
- `*.code-workspace` - Personal workspace configuration
- `launch.json` - Personal debug configuration
- `tasks.json` - Personal tasks

## 🆕 Onboarding for New Team Members

When opening the project for the first time:

1. **VSCode will ask to install recommended extensions** → Accept (Install All)

2. **Verify Biome works**:
   - Open any `.ts` or `.tsx` file
   - Make a change that violates rules (e.g., use double quotes instead of single)
   - Save the file (`Cmd+S` / `Ctrl+S`)
   - Code should auto-format automatically

3. **Configure REST Client**:
   - See [`apps/api/http-client/README.md`](../../apps/api/http-client/README.md) for detailed setup

## 🔧 Troubleshooting

### Auto-formatting doesn't work
- Verify Biome is installed: search for "Biome" in extensions list
- Restart VSCode: `Cmd+Shift+P` → "Reload Window"
- Check Biome output for errors: View → Output → Select "Biome" in dropdown

### REST Client issues
- See [`apps/api/http-client/README.md`](../../apps/api/http-client/README.md)

## 📚 More Information

- [Biome Documentation](https://biomejs.dev/)
- [REST Client Documentation](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [VSCode Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings)
