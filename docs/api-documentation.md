# Zoopervizor API Documentation

## Overview

Zoopervizor exposes both REST API and WebSocket API for external agents to monitor and control Roo-Code activities.

**Base URL**: `http://localhost:3737` (configurable via settings)

## Authentication

Currently, no authentication is required (MVP). The API server binds to localhost only for security.

**Future**: Token-based authentication will be added in future versions.

## REST API

### Health Check

Check if Zoopervizor is running and connected to Roo-Code.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "rooCodeConnected": true,
  "version": "0.1.0",
  "uptime": 12345
}
```

**Status Codes**:
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is running but Roo-Code is not connected

**Example**:
```bash
curl http://localhost:3737/health
```

---

### Get Status

Get current Roo-Code status and active tasks.

**Endpoint**: `GET /status`

**Response**:
```json
{
  "isReady": true,
  "currentTaskStack": ["task-id-123"],
  "activeProfile": "default",
  "configuration": {
    "mode": "code",
    "currentApiConfigName": "default"
  }
}
```

**Status Codes**:
- `200 OK`: Status retrieved successfully
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl http://localhost:3737/status
```

---

### Start New Task

Start a new Roo-Code task with specified configuration.

**Endpoint**: `POST /tasks/start`

**Request Body**:
```json
{
  "text": "Create a new React component called UserProfile",
  "configuration": {
    "mode": "code",
    "currentApiConfigName": "my-profile"
  },
  "images": [],
  "newTab": false
}
```

**Parameters**:
- `text` (string, required): The task description/prompt
- `configuration` (object, optional): Task configuration
  - `mode` (string, optional): Mode to use (code, architect, ask, debug)
  - `currentApiConfigName` (string, optional): API profile to use
- `images` (array, optional): Array of base64-encoded images
- `newTab` (boolean, optional): Open task in new tab

**Response**:
```json
{
  "taskId": "task-id-123",
  "status": "started"
}
```

**Status Codes**:
- `200 OK`: Task started successfully
- `400 Bad Request`: Invalid request body
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
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

---

### Send Message to Task

Send a message to the currently active task.

**Endpoint**: `POST /tasks/message`

**Request Body**:
```json
{
  "message": "Use TypeScript instead of JavaScript",
  "images": []
}
```

**Parameters**:
- `message` (string, required): The message to send
- `images` (array, optional): Array of base64-encoded images

**Response**:
```json
{
  "status": "sent"
}
```

**Status Codes**:
- `200 OK`: Message sent successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: No active task
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl -X POST http://localhost:3737/tasks/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add error handling"
  }'
```

---

### Cancel Current Task

Cancel the currently active task.

**Endpoint**: `POST /tasks/cancel`

**Response**:
```json
{
  "status": "cancelled"
}
```

**Status Codes**:
- `200 OK`: Task cancelled successfully
- `404 Not Found`: No active task
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl -X POST http://localhost:3737/tasks/cancel
```

---

### Resume Task

Resume a previously paused or idle task.

**Endpoint**: `POST /tasks/resume`

**Request Body**:
```json
{
  "taskId": "task-id-123"
}
```

**Parameters**:
- `taskId` (string, required): The ID of the task to resume

**Response**:
```json
{
  "status": "resumed"
}
```

**Status Codes**:
- `200 OK`: Task resumed successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: Task not found
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl -X POST http://localhost:3737/tasks/resume \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-id-123"
  }'
```

---

### Get Configuration

Get current Roo-Code configuration.

**Endpoint**: `GET /configuration`

**Response**:
```json
{
  "mode": "code",
  "currentApiConfigName": "default",
  "customInstructions": "",
  "alwaysAllowReadOnly": false
}
```

**Status Codes**:
- `200 OK`: Configuration retrieved successfully
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl http://localhost:3737/configuration
```

---

### Update Configuration

Update Roo-Code configuration.

**Endpoint**: `PUT /configuration`

**Request Body**:
```json
{
  "mode": "architect",
  "currentApiConfigName": "my-profile"
}
```

**Response**:
```json
{
  "status": "updated"
}
```

**Status Codes**:
- `200 OK`: Configuration updated successfully
- `400 Bad Request`: Invalid request body
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl -X PUT http://localhost:3737/configuration \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "code"
  }'
```

---

### List Profiles

Get list of all API profiles.

**Endpoint**: `GET /profiles`

**Response**:
```json
{
  "profiles": ["default", "my-profile", "production"],
  "active": "default"
}
```

**Status Codes**:
- `200 OK`: Profiles retrieved successfully
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl http://localhost:3737/profiles
```

---

### Set Active Profile

Set the active API profile.

**Endpoint**: `POST /profiles/active`

**Request Body**:
```json
{
  "name": "my-profile"
}
```

**Parameters**:
- `name` (string, required): The name of the profile to activate

**Response**:
```json
{
  "status": "activated",
  "profile": "my-profile"
}
```

**Status Codes**:
- `200 OK`: Profile activated successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: Profile not found
- `503 Service Unavailable`: Roo-Code not connected

**Example**:
```bash
curl -X POST http://localhost:3737/profiles/active \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production"
  }'
```

---

## WebSocket API

### Connection

Connect to the WebSocket server for real-time event streaming.

**Endpoint**: `ws://localhost:3737/events`

**Example (JavaScript)**:
```javascript
const ws = new WebSocket('ws://localhost:3737/events');

ws.onopen = () => {
  console.log('Connected to Zoopervizor');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from Zoopervizor');
};
```

**Example (Python)**:
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Event: {data['eventName']}")
    print(f"Payload: {data['payload']}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connected to Zoopervizor")
    # Subscribe to specific events
    ws.send(json.dumps({
        "type": "subscribe",
        "events": ["taskStarted", "taskCompleted"]
    }))

ws = websocket.WebSocketApp(
    "ws://localhost:3737/events",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

ws.run_forever()
```

---

### Subscribe to Events

Filter which events you want to receive.

**Client → Server Message**:
```json
{
  "type": "subscribe",
  "events": ["taskStarted", "taskCompleted", "message"]
}
```

**Parameters**:
- `type` (string, required): Must be "subscribe"
- `events` (array, required): Array of event names to subscribe to

**Available Events**:
- `taskCreated`
- `taskStarted`
- `taskCompleted`
- `taskAborted`
- `taskFocused`
- `taskUnfocused`
- `taskActive`
- `taskInteractive`
- `taskResumable`
- `taskIdle`
- `taskPaused`
- `taskUnpaused`
- `taskSpawned`
- `message`
- `taskModeSwitched`
- `taskAskResponded`
- `taskUserMessage`
- `taskTokenUsageUpdated`
- `taskToolFailed`
- `modeChanged`
- `providerProfileChanged`

**Response**:
```json
{
  "type": "subscribed",
  "events": ["taskStarted", "taskCompleted", "message"]
}
```

---

### Unsubscribe from Events

Stop receiving specific events.

**Client → Server Message**:
```json
{
  "type": "unsubscribe",
  "events": ["message"]
}
```

**Response**:
```json
{
  "type": "unsubscribed",
  "events": ["message"]
}
```

---

### Event Messages

Events are sent from server to client in the following format:

**Server → Client Message**:
```json
{
  "type": "event",
  "timestamp": "2025-10-11T03:00:00.000Z",
  "eventName": "taskStarted",
  "payload": ["task-id-123"],
  "taskId": "task-id-123"
}
```

**Fields**:
- `type` (string): Always "event"
- `timestamp` (string): ISO 8601 timestamp
- `eventName` (string): Name of the event
- `payload` (array): Event-specific payload
- `taskId` (string, optional): Task ID if applicable

---

### Event Payload Examples

#### taskStarted
```json
{
  "type": "event",
  "timestamp": "2025-10-11T03:00:00.000Z",
  "eventName": "taskStarted",
  "payload": ["task-id-123"],
  "taskId": "task-id-123"
}
```

#### taskCompleted
```json
{
  "type": "event",
  "timestamp": "2025-10-11T03:05:00.000Z",
  "eventName": "taskCompleted",
  "payload": [
    "task-id-123",
    {
      "totalTokens": 1500,
      "inputTokens": 1000,
      "outputTokens": 500
    },
    {
      "read_file": 5,
      "write_to_file": 3,
      "execute_command": 2
    },
    {
      "isSubtask": false
    }
  ],
  "taskId": "task-id-123"
}
```

#### message
```json
{
  "type": "event",
  "timestamp": "2025-10-11T03:02:00.000Z",
  "eventName": "message",
  "payload": [
    {
      "taskId": "task-id-123",
      "action": "created",
      "message": {
        "type": "say",
        "say": "api_req_started",
        "text": "Starting API request..."
      }
    }
  ],
  "taskId": "task-id-123"
}
```

#### taskToolFailed
```json
{
  "type": "event",
  "timestamp": "2025-10-11T03:03:00.000Z",
  "eventName": "taskToolFailed",
  "payload": [
    "task-id-123",
    "execute_command",
    "Command failed with exit code 1"
  ],
  "taskId": "task-id-123"
}
```

---

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ROO_CODE_NOT_CONNECTED` | 503 | Roo-Code extension is not connected |
| `INVALID_REQUEST` | 400 | Request body is invalid or missing required fields |
| `TASK_NOT_FOUND` | 404 | Specified task ID does not exist |
| `NO_ACTIVE_TASK` | 404 | No task is currently active |
| `PROFILE_NOT_FOUND` | 404 | Specified profile does not exist |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Example Error Response

```json
{
  "error": {
    "code": "ROO_CODE_NOT_CONNECTED",
    "message": "Roo-Code extension is not connected. Please ensure it is installed and activated.",
    "details": {
      "extensionId": "rooveterinaryinc.roo-code",
      "installed": true,
      "activated": false
    }
  }
}
```

---

## Rate Limiting

**Current**: No rate limiting in MVP

**Future**: Rate limiting will be implemented to prevent abuse:
- 100 requests per minute per client
- 10 WebSocket connections per client
- Burst allowance of 20 requests

---

## CORS

**Current**: CORS is disabled (localhost only)

**Future**: Configurable CORS settings for specific origins

---

## Complete Integration Example

### Node.js Example

```javascript
const axios = require('axios');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:3737';
const WS_URL = 'ws://localhost:3737/events';

// Connect to WebSocket for events
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to Zoopervizor');
  
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['taskStarted', 'taskCompleted', 'taskToolFailed']
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log(`Event: ${event.eventName}`, event.payload);
  
  if (event.eventName === 'taskCompleted') {
    const [taskId, tokenUsage] = event.payload;
    console.log(`Task ${taskId} completed with ${tokenUsage.totalTokens} tokens`);
  }
});

// Start a task via REST API
async function startTask() {
  try {
    const response = await axios.post(`${API_BASE}/tasks/start`, {
      text: 'Create a new React component called UserProfile',
      configuration: {
        mode: 'code'
      }
    });
    
    console.log('Task started:', response.data.taskId);
    return response.data.taskId;
  } catch (error) {
    console.error('Failed to start task:', error.response?.data || error.message);
  }
}

// Send a message to the task
async function sendMessage(message) {
  try {
    await axios.post(`${API_BASE}/tasks/message`, {
      message
    });
    console.log('Message sent');
  } catch (error) {
    console.error('Failed to send message:', error.response?.data || error.message);
  }
}

// Main flow
(async () => {
  // Wait for WebSocket connection
  await new Promise(resolve => ws.on('open', resolve));
  
  // Start a task
  const taskId = await startTask();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Send additional instructions
  await sendMessage('Add TypeScript types');
})();
```

### Python Example

```python
import requests
import websocket
import json
import threading
import time

API_BASE = 'http://localhost:3737'
WS_URL = 'ws://localhost:3737/events'

class ZoopervizorClient:
    def __init__(self):
        self.ws = None
        self.connected = False
        
    def connect_websocket(self):
        def on_message(ws, message):
            data = json.loads(message)
            print(f"Event: {data['eventName']}")
            
            if data['eventName'] == 'taskCompleted':
                task_id, token_usage = data['payload'][:2]
                print(f"Task {task_id} completed with {token_usage['totalTokens']} tokens")
        
        def on_open(ws):
            print("Connected to Zoopervizor")
            self.connected = True
            # Subscribe to events
            ws.send(json.dumps({
                'type': 'subscribe',
                'events': ['taskStarted', 'taskCompleted', 'taskToolFailed']
            }))
        
        self.ws = websocket.WebSocketApp(
            WS_URL,
            on_open=on_open,
            on_message=on_message
        )
        
        # Run WebSocket in separate thread
        ws_thread = threading.Thread(target=self.ws.run_forever)
        ws_thread.daemon = True
        ws_thread.start()
        
        # Wait for connection
        while not self.connected:
            time.sleep(0.1)
    
    def start_task(self, text, mode='code'):
        response = requests.post(f'{API_BASE}/tasks/start', json={
            'text': text,
            'configuration': {
                'mode': mode
            }
        })
        response.raise_for_status()
        return response.json()['taskId']
    
    def send_message(self, message):
        response = requests.post(f'{API_BASE}/tasks/message', json={
            'message': message
        })
        response.raise_for_status()
    
    def cancel_task(self):
        response = requests.post(f'{API_BASE}/tasks/cancel')
        response.raise_for_status()

# Usage
client = ZoopervizorClient()
client.connect_websocket()

# Start a task
task_id = client.start_task('Create a new React component')
print(f"Started task: {task_id}")

# Send additional instructions
time.sleep(5)
client.send_message('Add error handling')

# Keep running to receive events
time.sleep(60)
```

---

## Changelog

### v0.1.0 (MVP)
- Initial REST API implementation
- WebSocket event streaming
- Basic task control endpoints
- Configuration management
- Profile management

### Future Versions
- Authentication and authorization
- Rate limiting
- CORS configuration
- Webhook support
- Event filtering and transformation
- Task history API
- Analytics endpoints