# Zoopervizor

A VSCode extension that monitors Roo-Code activities and provides an API bridge for external agent communication.

## Features

- 🎯 **Event Monitoring**: Listen to all Roo-Code task lifecycle events
- 📊 **Visual Feedback**: Status bar integration showing real-time activity
- 🌐 **External API**: HTTP REST API and WebSocket server for external agents
- 📝 **Comprehensive Logging**: Detailed logging to VSCode Output channel
- ⚙️ **Configurable**: Flexible configuration options for all features

## Installation

### From VSIX

1. Download the latest `.vsix` file from releases
2. In VSCode, go to Extensions view (Ctrl+Shift+X)
3. Click "..." menu → "Install from VSIX..."
4. Select the downloaded file

### From Source

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zoopervizor
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

## Requirements

- VSCode 1.85.0 or higher
- Roo-Code extension installed
- Node.js 18+ (for development)

## Configuration

Configure Zoopervizor through VSCode settings (File → Preferences → Settings → search for "Zoopervizor"):

```json
{
  "zoopervizor.enabled": true,
  "zoopervizor.api.enabled": true,
  "zoopervizor.api.port": 3737,
  "zoopervizor.logging.level": "info",
  "zoopervizor.logging.showInOutput": true,
  "zoopervizor.statusBar.enabled": true,
  "zoopervizor.bytebot.enabled": true,
  "zoopervizor.bytebot.maxConcurrentDelegations": 3,
  "zoopervizor.bytebot.delegationTimeout": 300000,
  "zoopervizor.bytebot.autoCleanupCompletedAfter": 3600000
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `zoopervizor.enabled` | boolean | `true` | Enable/disable Zoopervizor monitoring |
| `zoopervizor.api.enabled` | boolean | `true` | Enable/disable API server |
| `zoopervizor.api.port` | number | `3737` | Port for API server |
| `zoopervizor.logging.level` | string | `"info"` | Logging level (debug, info, warn, error) |
| `zoopervizor.logging.showInOutput` | boolean | `true` | Show logs in Output channel |
| `zoopervizor.statusBar.enabled` | boolean | `true` | Show status bar item |
| `zoopervizor.bytebot.enabled` | boolean | `true` | Enable/disable Bytebot adapter integration |
| `zoopervizor.bytebot.maxConcurrentDelegations` | number | `3` | Maximum concurrent delegations |
| `zoopervizor.bytebot.delegationTimeout` | number | `300000` | Delegation timeout in milliseconds (5 minutes) |
| `zoopervizor.bytebot.autoCleanupCompletedAfter` | number | `3600000` | Auto-cleanup completed delegations after milliseconds (1 hour) |

## Usage

### Viewing Logs

1. Click the Zoopervizor status bar item (bottom right), or
2. Run command: `Zoopervizor: Show Output` (Ctrl+Shift+P)
3. View logs in the Output panel

### Using the REST API

The API server runs on `http://localhost:3737` by default.

#### Health Check
```bash
curl http://localhost:3737/health
```

#### Start a Task
```bash
curl -X POST http://localhost:3737/tasks/start \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Create a new React component",
    "configuration": {
      "mode": "code"
    }
  }'
```

#### Send a Message
```bash
curl -X POST http://localhost:3737/tasks/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Use TypeScript instead"
  }'
```

#### Cancel Current Task
```bash
curl -X POST http://localhost:3737/tasks/cancel
```

### Using the WebSocket API

Connect to `ws://localhost:3737/events` for real-time event streaming.

#### JavaScript Example
```javascript
const ws = new WebSocket('ws://localhost:3737/events');

ws.onopen = () => {
  console.log('Connected to Zoopervizor');
  
  // Subscribe to specific events
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['taskStarted', 'taskCompleted', 'message']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.eventName, data.payload);
};
```

#### Python Example
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Event: {data['eventName']}")

def on_open(ws):
    # Subscribe to events
    ws.send(json.dumps({
        'type': 'subscribe',
        'events': ['taskStarted', 'taskCompleted']
    }))

ws = websocket.WebSocketApp(
    'ws://localhost:3737/events',
    on_open=on_open,
    on_message=on_message
)
ws.run_forever()
```

## API Endpoints

### REST API

- `GET /health` - Health check
- `GET /status` - Get current Roo-Code status
- `POST /tasks/start` - Start a new task
- `POST /tasks/message` - Send message to current task
- `POST /tasks/cancel` - Cancel current task
- `POST /tasks/resume` - Resume a task
- `GET /configuration` - Get Roo-Code configuration
- `PUT /configuration` - Update Roo-Code configuration
- `GET /profiles` - List API profiles
- `POST /profiles/active` - Set active profile

### WebSocket

- `ws://localhost:3737/events` - Event streaming endpoint

See [API Documentation](docs/api-documentation.md) for complete reference.

## Commands

- `Zoopervizor: Show Output` - Open the Zoopervizor output channel
- `Zoopervizor: Toggle Status Bar` - Show/hide the status bar item
- `Zoopervizor: Restart API Server` - Restart the API server

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
4. View logs in Output channel for details

### Events Not Being Logged

If events aren't appearing in the Output channel:

1. Check that `zoopervizor.enabled` is `true`
2. Verify `zoopervizor.logging.showInOutput` is `true`
3. Check the logging level setting
4. Ensure Roo-Code is actually running tasks

## Development

### Setup

```bash
git clone <repository-url>
cd zoopervizor
npm install
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

Zoopervizor consists of several key components:

- **RooCodeListener**: Connects to Roo-Code API and listens to events
- **RooCodeController**: Provides methods to control Roo-Code
- **Logger**: Centralized logging system
- **StatusBarManager**: Visual feedback in VSCode status bar
- **API Server**: HTTP REST API and WebSocket server
- **BytebotAdapter**: Integration layer for external agent delegation (optional)

### Bytebot Integration

Zoopervizor includes an optional adapter layer for integrating with external agents like Bytebot. The adapter provides:

- **Task Delegation**: Delegate coding tasks to Roo-Code from external agents
- **Event Normalization**: Convert Roo-Code events to agent-friendly formats
- **Task Coordination**: Manage multiple concurrent delegations
- **Question Handling**: Handle interactive questions during task execution

See [Architecture Plan](docs/architecture-plan.md) for detailed information.

## Documentation

- [Architecture Plan](docs/architecture-plan.md) - Detailed system architecture
- [Implementation Guide](docs/implementation-guide.md) - Step-by-step implementation
- [API Documentation](docs/api-documentation.md) - Complete API reference
- [Bytebot Integration](docs/bytebot-integration.md) - External agent integration guide
- [Quick Start Guide](docs/quick-start.md) - Quick start for users and developers

## Contributing

Contributions are welcome! Please read the [Implementation Guide](docs/implementation-guide.md) for development guidelines.

## License

MIT - See [LICENSE](LICENSE) file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Acknowledgments

- Roo-Code team for the excellent API design
- VSCode extension development community

---

**Version**: 0.1.0  
**Status**: MVP Release  
**Maintained by**: Zoopervizor Contributors