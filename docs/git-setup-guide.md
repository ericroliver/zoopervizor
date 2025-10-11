# Git Repository Setup Guide

## Overview

This guide provides all the necessary configuration files for setting up the git repository for the Zupervizor project.

## Step 1: Initialize Git Repository

Run the following command in the project root:

```bash
git init
```

## Step 2: Create .gitignore

Create a `.gitignore` file in the project root with the following content:

```gitignore
# Compiled output
out/
dist/
*.vsix

# Node modules
node_modules/

# TypeScript cache
*.tsbuildinfo

# VSCode settings (optional - uncomment if you want to ignore)
# .vscode/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# IDE
.idea/
*.swp
*.swo
*~

# Test coverage
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp
```

## Step 3: Create .gitattributes

Create a `.gitattributes` file in the project root:

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# TypeScript files
*.ts text eol=lf
*.tsx text eol=lf

# JavaScript files
*.js text eol=lf
*.jsx text eol=lf

# JSON files
*.json text eol=lf

# Markdown files
*.md text eol=lf

# Shell scripts
*.sh text eol=lf

# Windows scripts
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf
```

## Step 4: Create README.md

Create a `README.md` file in the project root:

```markdown
# Zupervizor

A VSCode extension that monitors Roo-Code activities and provides an API bridge for external agent communication.

## Features

- 🎯 **Event Monitoring**: Listen to all Roo-Code task lifecycle events
- 📊 **Visual Feedback**: Status bar integration showing real-time activity
- 🌐 **External API**: HTTP REST API and WebSocket server for external agents
- 📝 **Comprehensive Logging**: Detailed logging to VSCode Output channel
- ⚙️ **Configurable**: Flexible configuration options for all features

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zupervizor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open in VSCode and press F5 to launch Extension Development Host

### From VSIX

1. Download the latest `.vsix` file from releases
2. In VSCode, go to Extensions view (Ctrl+Shift+X)
3. Click "..." menu → "Install from VSIX..."
4. Select the downloaded file

## Requirements

- VSCode 1.85.0 or higher
- Roo-Code extension installed
- Node.js 18+ (for development)

## Configuration

Configure Zupervizor through VSCode settings:

```json
{
  "zupervizor.enabled": true,
  "zupervizor.api.enabled": true,
  "zupervizor.api.port": 3737,
  "zupervizor.logging.level": "info",
  "zupervizor.logging.showInOutput": true,
  "zupervizor.statusBar.enabled": true
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `zupervizor.enabled` | boolean | `true` | Enable/disable Zupervizor monitoring |
| `zupervizor.api.enabled` | boolean | `true` | Enable/disable API server |
| `zupervizor.api.port` | number | `3737` | Port for API server |
| `zupervizor.logging.level` | string | `"info"` | Logging level (debug, info, warn, error) |
| `zupervizor.logging.showInOutput` | boolean | `true` | Show logs in Output channel |
| `zupervizor.statusBar.enabled` | boolean | `true` | Show status bar item |

## API Documentation

### REST API Endpoints

#### Health Check
```http
GET http://localhost:3737/health
```

Response:
```json
{
  "status": "ok",
  "rooCodeConnected": true,
  "version": "0.1.0"
}
```

#### Get Status
```http
GET http://localhost:3737/status
```

#### Start Task
```http
POST http://localhost:3737/tasks/start
Content-Type: application/json

{
  "text": "Create a new React component",
  "configuration": {
    "mode": "code"
  }
}
```

#### Send Message
```http
POST http://localhost:3737/tasks/message
Content-Type: application/json

{
  "message": "Use TypeScript instead"
}
```

#### Cancel Task
```http
POST http://localhost:3737/tasks/cancel
```

### WebSocket API

Connect to the WebSocket server for real-time event streaming:

```javascript
const ws = new WebSocket('ws://localhost:3737/events');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.eventName, data.payload);
};

// Subscribe to specific events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['taskStarted', 'taskCompleted', 'message']
}));
```

## Commands

- `Zupervizor: Show Output` - Open the Zupervizor output channel
- `Zupervizor: Toggle Status Bar` - Show/hide the status bar item
- `Zupervizor: Restart API Server` - Restart the API server

## Development

### Setup

```bash
npm install
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Testing

Press F5 in VSCode to launch the Extension Development Host with the extension loaded.

### Packaging

```bash
npm run package
```

This creates a `.vsix` file that can be installed in VSCode.

## Architecture

Zupervizor consists of several key components:

- **RooCodeListener**: Connects to Roo-Code API and listens to events
- **RooCodeController**: Provides methods to control Roo-Code
- **Logger**: Centralized logging system
- **StatusBarManager**: Visual feedback in VSCode status bar
- **API Server**: HTTP REST API and WebSocket server

See [Architecture Plan](docs/architecture-plan.md) for detailed information.

## Troubleshooting

### Roo-Code Not Found

If you see "Roo-Code Not Found" in the status bar:

1. Ensure Roo-Code extension is installed
2. Restart VSCode
3. Check the Output channel for detailed error messages

### API Server Won't Start

If the API server fails to start:

1. Check if port 3737 is already in use
2. Try changing the port in settings
3. Check firewall settings

### Events Not Being Logged

If events aren't appearing in the Output channel:

1. Check that `zupervizor.enabled` is `true`
2. Verify `zupervizor.logging.showInOutput` is `true`
3. Check the logging level setting
4. Ensure Roo-Code is actually running tasks

## Contributing

Contributions are welcome! Please read the [Implementation Guide](docs/implementation-guide.md) for development guidelines.

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.
```

## Step 5: Create LICENSE

Create a `LICENSE` file in the project root (MIT License example):

```text
MIT License

Copyright (c) 2025 [Your Name/Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Step 6: Initial Commit

After creating all the files, make your initial commit:

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Zupervizor VSCode extension boilerplate

- Add project documentation (architecture, implementation guide)
- Add git configuration (.gitignore, .gitattributes)
- Add README with features and API documentation
- Add MIT license"
```

## Step 7: Create .vscode Directory (Optional)

Create a `.vscode` directory with recommended settings for the project:

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "out": true,
    "dist": true,
    "**/*.vsix": true
  },
  "search.exclude": {
    "out": true,
    "dist": true,
    "node_modules": true
  }
}
```

### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
      ],
      "outFiles": [
        "${workspaceFolder}/out/test/**/*.js"
      ],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

### .vscode/tasks.json

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "watch",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "presentation": {
        "reveal": "never"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "type": "npm",
      "script": "compile",
      "problemMatcher": "$tsc",
      "group": "build"
    }
  ]
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Step 8: Create Branch Strategy (Optional)

If working in a team, consider this branch strategy:

```bash
# Create development branch
git checkout -b develop

# Feature branches
git checkout -b feature/api-server
git checkout -b feature/event-listener
git checkout -b feature/status-bar

# Bugfix branches
git checkout -b bugfix/connection-error

# Release branches
git checkout -b release/v0.1.0
```

## Git Workflow Summary

1. **Initialize**: `git init`
2. **Create files**: `.gitignore`, `.gitattributes`, `README.md`, `LICENSE`
3. **Initial commit**: Commit all documentation and configuration
4. **Create branches**: Set up development workflow
5. **Regular commits**: Commit frequently with clear messages
6. **Push to remote**: `git remote add origin <url>` and `git push -u origin main`

## Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add WebSocket event streaming

Implement WebSocket server for real-time event streaming to external agents.
Supports event filtering and subscription management.

Closes #123
```

```
fix(listener): handle Roo-Code connection errors

Add retry logic with exponential backoff when Roo-Code extension
is not immediately available.
```

## Next Steps

After setting up git:

1. Create the actual files listed above
2. Make initial commit
3. Set up remote repository (GitHub, GitLab, etc.)
4. Push to remote: `git push -u origin main`
5. Continue with implementation following the todo list