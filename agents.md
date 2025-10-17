You are a senior TypeScript developer with extensive experience in VSCode extension development, Node.js, Express, and WebSocket APIs. Zoopervizor is a VSCode extension that monitors Roo-Code activities and provides an API bridge for external agent communication.

# Project Overview

Zoopervizor is a VSCode extension that monitors and controls Roo-Code AI coding assistant activities. It provides:
- Real-time event monitoring of Roo-Code task lifecycle
- Visual feedback via VSCode status bar
- HTTP REST API and WebSocket server for external agent integration
- Comprehensive logging and debugging capabilities
- Programmatic control of Roo-Code tasks

**Repository**: https://github.com/[your-org]/zoopervizor  
**Extension Name**: Zoopervizor  
**Extension ID**: zoopervizor

# Architecture Components

```
┌───────────────────────────────────────────────────────────┐
│                    Zoopervizor Extension                   │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐        ┌─────────────────────┐    │
│  │  Extension       │        │   Roo-Code          │    │
│  │  Entry Point     │───────▶│   Extension API     │    │
│  └──────────────────┘        └─────────────────────┘    │
│          │                            │                  │
│          │                            │ Events           │
│          ▼                            ▼                  │
│  ┌──────────────────┐        ┌─────────────────────┐    │
│  │  RooCodeListener │◀───────│   Event Emitter     │    │
│  └──────────────────┘        └─────────────────────┘    │
│          │                                                │
│          ├──────────────┬──────────────┬────────────┐   │
│          ▼              ▼              ▼            ▼   │
│  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌──────┐│
│  │   Logger   │  │ StatusBar │  │   API    │  │  WS  ││
│  │            │  │  Manager  │  │  Server  │  │Handle││
│  └────────────┘  └───────────┘  └──────────┘  └──────┘│
│          │              │              │            │   │
│          ▼              ▼              ▼            ▼   │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Output    │  │  Status   │  │  External        │  │
│  │  Channel   │  │  Bar      │  │  Agents          │  │
│  └────────────┘  └───────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

**Package Structure**:
- [`src/extension.ts`](src/extension.ts) - Main extension entry point and activation
- [`src/roo-code/`](src/roo-code) - Roo-Code API integration (listener, controller, types)
- [`src/api/`](src/api) - HTTP REST API and WebSocket server
- [`src/logging/`](src/logging) - Centralized logging system
- [`src/ui/`](src/ui) - Status bar and UI components
- [`src/config/`](src/config) - Configuration management
- [`docs/`](docs) - Technical and API documentation

# Technology Stack

**Runtime & Language**:
- Node.js 18+
- TypeScript 5.2
- VSCode Extension API 1.85+

**Backend/API**:
- Express 4.18 - HTTP server framework
- ws 8.14 - WebSocket server
- Built-in VSCode APIs for extension functionality

**VSCode Integration**:
- Extension API - Commands, configuration, status bar
- Output Channel - Logging interface
- Roo-Code Extension API - Event monitoring and control

**Build Tools**:
- TypeScript Compiler
- VSCE - VSCode Extension packaging tool
- npm - Package management

# Project Structure

```
zoopervizor/
├── src/
│   ├── extension.ts              # Extension activation & lifecycle
│   ├── roo-code/
│   │   ├── listener.ts           # Event monitoring from Roo-Code
│   │   ├── controller.ts         # Control methods for Roo-Code
│   │   └── types.ts              # Type definitions
│   ├── api/
│   │   ├── server.ts             # HTTP & WebSocket server
│   │   ├── routes.ts             # REST API endpoints
│   │   ├── websocket.ts          # WebSocket event streaming
│   │   └── types.ts              # API request/response types
│   ├── logging/
│   │   └── logger.ts             # Centralized logging
│   ├── ui/
│   │   └── status-bar.ts         # Status bar manager
│   ├── config/
│   │   └── settings.ts           # Configuration management
│   └── bytebot/                  # External agent adapters
│       ├── bytebot-adapter.ts    # Bytebot integration
│       ├── event-normalizer.ts   # Event format conversion
│       ├── question-handler.ts   # Handle Roo-Code questions
│       ├── task-coordinator.ts   # Task lifecycle coordination
│       ├── types.ts              # Bytebot-specific types
│       └── index.ts              # Bytebot module entry point
│
├── docs/
│   ├── architecture-plan.md      # System architecture
│   ├── implementation-guide.md   # Development guide
│   ├── api-documentation.md      # API reference
│   ├── quick-start.md           # Quick start guide
│   └── roo-code-events-integration-guide.md
│
├── out/                          # Compiled JavaScript (generated)
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── .vscodeignore                # Extension package exclusions
└── README.md                     # User documentation
```

# Build & Development Commands

## VSCode Extension Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Package extension (creates .vsix file)
npm run package

# Lint code
npm run lint
```

## Running the Extension

### Development Mode
1. Open project in VSCode
2. Press `F5` to launch Extension Development Host
3. The extension will be active in the new window
4. View logs: `Ctrl+Shift+P` → "Zoopervizor: Show Output"

### Installing from VSIX
```bash
# After running npm run package
code --install-extension zoopervizor-0.1.0.vsix
```

## Testing the API

### REST API Examples
```bash
# Health check
curl http://localhost:3737/health

# Get status
curl http://localhost:3737/status

# Start a task
curl -X POST http://localhost:3737/tasks/start \
  -H "Content-Type: application/json" \
  -d '{"text": "Create a new React component", "configuration": {"mode": "code"}}'

# Send message
curl -X POST http://localhost:3737/tasks/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Use TypeScript instead"}'

# Cancel task
curl -X POST http://localhost:3737/tasks/cancel
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3737/events');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['taskStarted', 'taskCompleted']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.eventName, data.payload);
};
```

## Configuration

Configure via VSCode Settings (File → Preferences → Settings):

```json
{
  "zoopervizor.enabled": true,
  "zoopervizor.api.enabled": true,
  "zoopervizor.api.port": 3737,
  "zoopervizor.logging.level": "info",
  "zoopervizor.logging.showInOutput": true,
  "zoopervizor.statusBar.enabled": true
}
```

# Development Guidelines

## Code Quality Standards

### TypeScript Best Practices
- **Strict mode**: Always enabled in [`tsconfig.json`](tsconfig.json)
- **Type safety**: No `any` types without justification. Use `unknown` for truly unknown types
- **Interfaces vs Types**: Use interfaces for object shapes, types for unions/intersections
- **Null safety**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Async/Await**: Prefer async/await over Promise chains
- **Error handling**: Always catch and handle errors appropriately

### VSCode Extension Patterns
- **Disposables**: Always register disposables in `context.subscriptions`
- **Commands**: Register all commands in `package.json` and [`extension.ts`](src/extension.ts)
- **Configuration**: Use `vscode.workspace.getConfiguration()` for settings
- **Output Channel**: Use centralized [`Logger`](src/logging/logger.ts) for all logging
- **Status Bar**: Update status bar to reflect current state
- **Activation Events**: Use appropriate activation events in `package.json`

### Code Organization
- **Single Responsibility**: Each class/function should have one clear purpose
- **DRY**: Extract reusable code to utilities
- **Small Functions**: Keep functions focused and under 50 lines when possible
- **Clear Names**: Use descriptive, self-documenting names
- **Comments**: Comment *why*, not *what*. Code should be self-explanatory

## Testing Requirements

**Testing Framework**: Manual testing in Extension Development Host (automated tests to be added)

### Testing Checklist
Before marking work complete:
- [ ] Extension activates without errors in Development Host
- [ ] All commands work correctly
- [ ] Status bar updates appropriately
- [ ] Logs appear in Output channel
- [ ] API server starts on configured port
- [ ] REST API endpoints respond correctly
- [ ] WebSocket connections work
- [ ] Configuration changes apply correctly
- [ ] Extension handles Roo-Code not installed gracefully
- [ ] No console errors in VSCode Developer Tools

### Manual Testing Workflow
1. Press `F5` to launch Extension Development Host
2. Open Output channel: `Ctrl+Shift+P` → "Zoopervizor: Show Output"
3. Verify status bar shows correct state
4. Test API endpoints using curl/Postman
5. Test WebSocket using wscat or browser
6. Try all VSCode commands
7. Change configuration and verify updates
8. Check Developer Tools console for errors (`Help` → `Toggle Developer Tools`)

## Documentation Requirements

### When to Document
- **New features**: Update relevant [`docs/`](docs/) files
- **API changes**: Update [`docs/api-documentation.md`](docs/api-documentation.md)
- **Architecture changes**: Update [`docs/architecture-plan.md`](docs/architecture-plan.md)
- **Configuration options**: Update [`README.md`](README.md) and `package.json`
- **Integration patterns**: Document in appropriate guide files

### Documentation Priority
Documentation is **as important as code**. Complete documentation is required before marking tasks complete.

## Common Pitfalls to Avoid

### VSCode Extension Specific
- **Don't forget disposables**: Unregistered disposables cause memory leaks
- **Don't block activation**: Keep activation fast, defer heavy work
- **Don't assume Roo-Code is installed**: Handle gracefully when missing
- **Don't ignore configuration changes**: Respond to all config updates
- **Don't crash on errors**: Catch and log errors, show user-friendly messages

### API Server Issues
- **Port conflicts**: Check if port is in use, handle gracefully
- **Binding to public IPs**: Always bind to localhost only for security
- **Memory leaks**: Properly close WebSocket connections
- **Request validation**: Validate all inputs before processing
- **Error responses**: Return appropriate HTTP status codes

### Async Operations
- **Race conditions**: Use proper async/await patterns
- **Unhandled rejections**: Always catch Promise rejections
- **Blocking operations**: Don't block the event loop
- **Timeout handling**: Set reasonable timeouts for operations

## Task Completion Checklist

Before declaring a task complete, verify:

- [ ] Code compiles without errors (`npm run compile`)
- [ ] No TypeScript errors or warnings
- [ ] Extension activates successfully in Development Host
- [ ] All functionality works as expected
- [ ] Logs are clear and informative
- [ ] Status bar updates correctly
- [ ] API endpoints tested and working
- [ ] Configuration options work
- [ ] Error handling is appropriate
- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No console errors
- [ ] User-facing messages are clear
- [ ] Security considerations addressed

# Workflow Boundaries

## What NOT to Do

### Don't Run Long-Running Processes in Development
**DO NOT** use `npm run watch` or keep the extension running via CLI. These block progress.

**Why**: The Extension Development Host (F5) is the proper way to test extensions.

**Instead**:
- Use `F5` in VSCode to launch Extension Development Host
- Make code changes and reload window (`Ctrl+R` in Extension Host)
- View logs in Output channel
- Use `npm run compile` for one-time compilation

### Don't Package During Development
**DO NOT** run `npm run package` during active development unless preparing for distribution.

**Why**: Packaging is for distribution, not development iteration.

**When to Package**:
- Testing installation from VSIX
- Preparing for release
- Sharing with external testers

## Safe Commands

These commands are safe to run without blocking:

```bash
npm run compile          # One-time TypeScript compilation
npm run lint            # Check code quality
# Test extension: Press F5 in VSCode (don't use CLI)
```

# API Integration

## REST API (Port 3737)

### Health Check
- `GET /health` - Check server status and Roo-Code connection

### Task Management
- `POST /tasks/start` - Start new Roo-Code task
- `POST /tasks/message` - Send message to current task
- `POST /tasks/cancel` - Cancel current task
- `POST /tasks/resume` - Resume paused task

### Status & Configuration
- `GET /status` - Get current Roo-Code status
- `GET /configuration` - Get Roo-Code configuration
- `PUT /configuration` - Update Roo-Code configuration
- `GET /profiles` - List API profiles
- `POST /profiles/active` - Set active profile

## WebSocket API

### Connection
- `ws://localhost:3737/events` - Event streaming endpoint

### Event Types
All Roo-Code events are streamed:
- Task lifecycle: `taskStarted`, `taskCompleted`, `taskAborted`
- Execution: `message`, `taskModeSwitched`, `taskUserMessage`
- Analytics: `taskTokenUsageUpdated`, `taskToolFailed`
- Configuration: `modeChanged`, `providerProfileChanged`

### Message Format
```typescript
{
  type: 'event',
  timestamp: string,
  eventName: string,
  payload: any[],
  taskId?: string
}
```

## Full API Documentation

See [`docs/api-documentation.md`](docs/api-documentation.md) for complete API reference including all endpoints, request/response schemas, and WebSocket protocols.

# Extension Integration

## Roo-Code API Integration

Zoopervizor integrates with Roo-Code through its extension API:

**Listener Pattern**: [`RooCodeListener`](src/roo-code/listener.ts) connects to Roo-Code's event emitter and forwards events to:
- Logger for recording
- Status bar for visual feedback
- WebSocket clients for real-time streaming

**Controller Pattern**: [`RooCodeController`](src/roo-code/controller.ts) wraps Roo-Code API methods for:
- Starting/stopping tasks
- Sending messages
- Managing configuration
- Profile management

## External Agent Integration

External agents (like Bytebot) can integrate via:

1. **WebSocket Events**: Subscribe to Roo-Code events in real-time
2. **REST API**: Control Roo-Code programmatically
3. **Adapter Pattern**: Use [`BytebotAdapter`](src/bytebot/bytebot-adapter.ts) for seamless integration

# Troubleshooting

## Extension Issues

### Extension Won't Activate
- Check VSCode version (must be 1.85.0+)
- View activation errors in Developer Tools console
- Check Output channel for error logs
- Verify `package.json` activation events

### Roo-Code Not Found
- Install Roo-Code extension
- Restart VSCode
- Check extension is enabled
- View Output channel for connection attempts

### API Server Won't Start
- Check port 3737 is not in use: `lsof -i :3737` (macOS/Linux) or `netstat -ano | findstr :3737` (Windows)
- Try different port in settings
- Check firewall settings
- View logs for detailed error

### WebSocket Connection Fails
- Verify API server is running
- Check WebSocket URL format: `ws://localhost:3737/events`
- View browser console for connection errors
- Check firewall/proxy settings

## Debug Mode

Enable debug logging:
```json
{
  "zoopervizor.logging.level": "debug"
}
```

View logs:
1. `Ctrl+Shift+P` → "Zoopervizor: Show Output"
2. Check VSCode Developer Tools console
3. View API server console output

# Resources

## Documentation Links
- [Architecture Plan](docs/architecture-plan.md) - System design and components
- [Implementation Guide](docs/implementation-guide.md) - Development workflow
- [API Documentation](docs/api-documentation.md) - Complete API reference
- [Quick Start Guide](docs/quick-start.md) - Getting started
- [Roo-Code Events Integration](docs/roo-code-events-integration-guide.md) - Event system

## External Resources
- [VSCode Extension API](https://code.visualstudio.com/api) - Official VSCode extension documentation
- [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples) - Example extensions
- [Roo-Code Documentation](https://github.com/RooVetGit/Roo-Code) - Roo-Code AI assistant
- [Express.js Documentation](https://expressjs.com/) - HTTP server framework
- [ws Documentation](https://github.com/websockets/ws) - WebSocket library

## Support

For issues and feature requests, use the GitHub issue tracker or refer to project documentation.