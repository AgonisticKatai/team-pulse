# REST Client - Setup Guide

HTTP files in this directory use environment variables for credentials. This guide shows you how to configure them.

## ⚠️ IMPORTANT

**DO NOT** put credentials in `.vscode/settings.json` or commit them to Git. They belong in your **User Settings**.

## Quick Setup (2 minutes)

### 1. Open User Settings

- **Mac**: `Cmd + ,`
- **Windows/Linux**: `Ctrl + ,`
- **Menu**: Code → Preferences → Settings

### 2. Search and Edit

1. In the search bar, type: `rest-client.environmentVariables`
2. Click the small **"Edit in settings.json"** link that appears
3. Your User settings.json file will open

### 3. Add Configuration

Add this object to your User `settings.json` (replace placeholders with your actual values):

```json
"rest-client.environmentVariables": {
  "$shared": {
    "adminRoleTestEmail": "YOUR_ADMIN_EMAIL",
    "adminRoleTestPassword": "YOUR_ADMIN_PASSWORD",
    "jsonContentType": "application/json",
    "superAdminRoleTestEmail": "YOUR_SUPERADMIN_EMAIL",
    "superAdminRoleTestPassword": "YOUR_SUPERADMIN_PASSWORD",
    "userRoleTestEmail": "YOUR_USER_EMAIL",
    "userRoleTestPassword": "YOUR_USER_PASSWORD"
  },
  "dev": {
    "host": "dev.api.example.com",
    "protocol": "https"
  },
  "local": {
    "host": "localhost:3000",
    "protocol": "http"
  },
  "prod": {
    "host": "api.example.com",
    "protocol": "https"
  }
}
```

### 4. Save and Close

Save the file (`Cmd+S` / `Ctrl+S`) and close it.

---

## Available Variables

Once configured, these variables work in all `.http` files:

### Authentication
- `{{adminRoleTestEmail}}` / `{{adminRoleTestPassword}}`
- `{{superAdminRoleTestEmail}}` / `{{superAdminRoleTestPassword}}`
- `{{userRoleTestEmail}}` / `{{userRoleTestPassword}}`

### Environment
- `{{protocol}}` - Changes based on selected environment (`http` or `https`)
- `{{host}}` - API host (changes based on environment)
- Use: `{{protocol}}://{{host}}/api/endpoint`

### Other
- `{{jsonContentType}}` - Always `"application/json"`

---

## Switch Environment

Look at the **bottom right** of VSCode status bar:
- You'll see the current environment (e.g., "local")
- Click to switch between `local`, `dev`, or `prod`
- Variables like `{{host}}` and `{{protocol}}` update automatically

---

## Verify It Works

1. Open any `.http` file in this directory
2. Hover over variables like `{{adminRoleTestEmail}}`
3. You should see the actual value (not `REPLACE_...`)
4. Click **"Send Request"** button to test

---

## Troubleshooting

### Variables show "REPLACE_YOUR_..."
**Problem**: Variables not configured in User Settings  
**Fix**: Follow steps 1-4 above. Make sure you're editing **User Settings**, not Workspace Settings.

### No "Send Request" button
**Problem**: REST Client extension not installed  
**Fix**: Install `humao.rest-client` extension, then restart VSCode

### "Send Request" button does nothing
**Problem**: Server not running or wrong environment selected  
**Fix**: 
- For `local`: Start your API server (`pnpm dev` in `apps/api`)
- Check environment selector in status bar (bottom right)

### Variables appear without values (empty)
**Problem**: Syntax error in User settings.json  
**Fix**: Check that JSON is valid. Each property should have a comma except the last one.

---

## Security Notes

✅ **Safe to commit**:
- `.http` files with variable references (e.g., `{{userRoleTestEmail}}`)
- `.vscode/settings.json` without credentials

❌ **NEVER commit**:
- User Settings (they're outside the repo, you're safe)
- `.http` files with hardcoded credentials
- `.vscode/settings.json` with credentials

Your User Settings are stored in:
- **Mac**: `~/Library/Application Support/Code/User/settings.json`
- **Windows**: `%APPDATA%\Code\User\settings.json`
- **Linux**: `~/.config/Code/User/settings.json`

These files are **outside your project**, so they can never be committed to Git.
