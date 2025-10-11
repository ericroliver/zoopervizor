# Zupervizor - Quick Start Guide

## For Users

### Installation

1. **Install from VSIX** (when available):
   ```
   Extensions → ... → Install from VSIX → Select zupervizor-0.1.0.vsix
   ```

2. **Verify Installation**:
   - Look for "Zupervizor" in the status bar (bottom right)
   - Open Output panel (View → Output) and select "Zupervizor" from dropdown

### Basic Usage

1. **Start Monitoring**:
   - Zupervizor automatically starts when VSCode opens
   - Status bar shows connection status

2. **View Logs**:
   - Click status bar item, or
   - Run command: `Zupervizor: Show Output`

3. **Use External API**:
   ```bash
   # Check health
   curl http://localhost:3737/health
   
   # Start a task
   curl -X POST http://localhost:3737/tasks/start \
     -H "Content-Type: application/json" \
     -d '{"text": "Create a React component"}'
   ```

4. **Connect via WebSocket**:
   ```javascript
   const ws = new WebSocket('ws://localhost:3737/events');
   ws.onmessage = (e) => console.log(JSON.parse(e.data));
   ```

### Configuration

Open VSCode Settings (Ctrl+,) and search for "Zupervizor":

- **Enable/Disable**: `zupervizor.enabled`
- **API Port**: `zupervizor.api.port` (default: 3737)
- **Log Level**: `zupervizor.logging.level` (debug/info/warn/error)

---

## For Developers

### Setup Development Environment

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd roo-telemetry
   npm install
   ```

2. **Start Development**:
   ```bash
   npm run watch
   ```

3. **Launch Extension**:
   - Press `F5` in VSCode
   - Extension Development Host opens with extension loaded

4. **Test Changes**:
   - Make code changes
   - Reload Extension Development Host (Ctrl+R)

### Project Structure

```
src/
├── extension.ts          # Entry point - START HERE
├── roo-code/            # Roo-Code integration
├── logging/             # Logging system
├── ui/                  # Status bar
├── api/                 # HTTP/WebSocket server
├── config/              # Settings
└── utils/               # Utilities
```

### Implementation Order

Follow this order for best results:

1. **Foundation** (Day 1):
   - Git setup
   - npm init
   - TypeScript config
   - Directory structure

2. **Core Types** (Day 2):
   - `src/roo-code/types.ts`
   - `src/config/settings.ts`
   - `src/logging/logger.ts`

3. **UI & Integration** (Day 3):
   - `src/ui/status-bar.ts`
   - `src/roo-code/listener.ts`
   - `src/roo-code/controller.ts`

4. **API Server** (Days 4-5):
   - `src/api/server.ts`
   - `src/api/websocket.ts`
   - `src/api/routes.ts`

5. **Main Entry** (Day 6):
   - `src/extension.ts`
   - Wire everything together

6. **Testing & Polish** (Days 7-8):
   - Test all features
   - Fix bugs
   - Add error handling

7. **Documentation** (Day 9):
   - README
   - Examples
   - API docs

8. **Release** (Day 10):
   - Package
   - Test installation
   - Publish

### Key Commands

```bash
# Development
npm run watch          # Watch mode
npm run compile        # One-time compile

# Testing
# Press F5 in VSCode to launch Extension Development Host

# Packaging
npm run package        # Creates .vsix file

# Linting (if configured)
npm run lint          # Check code style
```

### Debugging

1. **Set Breakpoints**: Click left margin in VSCode
2. **Launch Debugger**: Press F5
3. **View Logs**: Check Debug Console and Output panel
4. **Inspect Variables**: Use Debug sidebar

### Common Issues

**Extension won't activate**:
- Check `package.json` activation events
- Look for errors in Debug Console

**Roo-Code not found**:
- Ensure Roo-Code is installed
- Check extension ID: `rooveterinaryinc.roo-code`

**API server won't start**:
- Check if port 3737 is in use
- Try different port in settings

**TypeScript errors**:
- Run `npm install` again
- Check `tsconfig.json`

---

## For Integrators

### Quick Integration Example

```javascript
// Node.js example
const axios = require('axios');
const WebSocket = require('ws');

// Connect to events
const ws = new WebSocket('ws://localhost:3737/events');
ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log(`Event: ${event.eventName}`);
});

// Start a task
async function startTask() {
  const response = await axios.post('http://localhost:3737/tasks/start', {
    text: 'Create a new feature',
    configuration: { mode: 'code' }
  });
  return response.data.taskId;
}

startTask().then(taskId => {
  console.log(`Started task: ${taskId}`);
});
```

### Python Integration

```python
import requests
import websocket

# Start task
response = requests.post('http://localhost:3737/tasks/start', json={
    'text': 'Create a new feature',
    'configuration': {'mode': 'code'}
})
task_id = response.json()['taskId']

# Listen to events
def on_message(ws, message):
    print(f"Event: {message}")

ws = websocket.WebSocketApp('ws://localhost:3737/events',
                           on_message=on_message)
ws.run_forever()
```

### Available Endpoints

- `GET /health` - Health check
- `GET /status` - Current status
- `POST /tasks/start` - Start task
- `POST /tasks/message` - Send message
- `POST /tasks/cancel` - Cancel task
- `ws://localhost:3737/events` - Event stream

See [API Documentation](api-documentation.md) for complete reference.

---

## Troubleshooting

### Check Health

```bash
curl http://localhost:3737/health
```

Expected response:
```json
{
  "status": "ok",
  "rooCodeConnected": true,
  "version": "0.1.0"
}
```

### View Logs

1. Open Output panel: View → Output
2. Select "Zupervizor" from dropdown
3. Check for errors or warnings

### Reset Extension

1. Disable extension
2. Reload VSCode
3. Enable extension
4. Check status bar

### Report Issues

If problems persist:

1. Collect logs from Output panel
2. Note VSCode version and OS
3. Check if Roo-Code is working
4. Create GitHub issue with details

---

## Next Steps

### For Users
- Configure settings to your preference
- Try the API endpoints
- Integrate with your tools

### For Developers
- Read [Implementation Guide](implementation-guide.md)
- Review [Architecture Plan](architecture-plan.md)
- Start with `src/extension.ts`

### For Integrators
- Read [API Documentation](api-documentation.md)
- Try example code
- Build your integration

---

## Resources

- **Architecture**: [architecture-plan.md](architecture-plan.md)
- **Implementation**: [implementation-guide.md](implementation-guide.md)
- **API Reference**: [api-documentation.md](api-documentation.md)
- **Git Setup**: [git-setup-guide.md](git-setup-guide.md)
- **Project Summary**: [project-summary.md](project-summary.md)

## Support

- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Documentation: Check docs/ folder

---

**Ready to start?** Switch to Code mode and begin implementation! 🚀