# HTTP Client / REST Client

This directory contains `.http` files used to test the API endpoints directly from VS Code using the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension.

## Prerequisites

1.  **VS Code**
2.  **REST Client Extension**: Install the extension `humao.rest-client`.

## Configuration

To make the requests work with environment variables (like `{{host}}`, `{{protocol}}`, or authentication tokens), you need to configure your VS Code workspace settings.

1.  **Locate the Example Settings**:
    Open `apps/api/http-client/settings.example.json`. This file contains the template for the environment variables.

2.  **Update Workspace Settings**:
    Copy the contents of `settings.example.json` (specifically the `rest-client.environmentVariables` object) into your project's root `.vscode/settings.json` file.

    If `.vscode/settings.json` already exists, merge the keys carefully.

    ```json
    // .vscode/settings.json
    {
      "rest-client.environmentVariables": {
        "$shared": {
          "jsonContentType": "application/json",
          // ... shared credentials
        },
        "local": {
          "host": "localhost:3000",
          "protocol": "http"
        },
        // ... other environments
      }
    }
    ```

3.  **Select Environment**:
    In any `.http` file, click on "No Environment" (or the current environment name) in the bottom right corner of VS Code (status bar) or press `Cmd+Option+E` (macOS) / `Ctrl+Alt+E` (Windows/Linux) to switch between `local`, `dev`, or `prod`.

## Usage

-   **Send Request**: Click the "Send Request" link that appears above each URL in the `.http` files.
-   **Variables**: The files use variables like `{{host}}` which are resolved based on the selected environment.
-   **Chaining Requests**: Some files may rely on variables set by previous requests (e.g., login requests setting an `authToken`). Ensure you run the authentication requests first if needed.

## File Structure

-   `auth.http`: Authentication endpoints (Login, Register, etc.).
-   `teams.http`: Team management endpoints.
-   `users.http`: User management endpoints.
-   `settings.example.json`: Template for configuration.
