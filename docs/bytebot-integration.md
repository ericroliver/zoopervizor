# Bytebot Integration Guide

## Overview

The Bytebot adapter provides an integration layer that allows external agents (like Bytebot) to delegate coding tasks to Roo-Code through Zupervizor. This enables autonomous agents to leverage Roo-Code's capabilities for code generation, modification, and analysis.

## Architecture

The Bytebot adapter consists of several key components:

### Components

1. **BytebotAdapter** (`src/bytebot/bytebot-adapter.ts`)
   - Main orchestrator for delegation management
   - Handles task delegation lifecycle
   - Coordinates between external agents and Roo-Code
   - Broadcasts delegation events via WebSocket

2. **EventNormalizer** (`src/bytebot/event-normalizer.ts`)
   - Converts Roo-Code events to agent-friendly formats
   - Creates standardized delegation events
   - Handles event mapping and transformation

3. **TaskCoordinator** (`src/bytebot/task-coordinator.ts`)
   - Manages delegation state and lifecycle
   - Tracks active delegations
   - Links Roo-Code tasks to delegation IDs
   - Handles cleanup of completed delegations

4. **QuestionHandler** (`src/bytebot/question-handler.ts`)
   - Manages interactive questions during task execution
   - Tracks pending questions per delegation
   - Provides question resolution interface

## Configuration

Enable and configure the Bytebot adapter in VSCode settings:

```json
{
  "zupervizor.bytebot.enabled": true,
  "zupervizor.bytebot.maxConcurrentDelegations": 3,
  "zupervizor.bytebot.delegationTimeout": 300000,
  "zupervizor.bytebot.autoCleanupCompletedAfter": 3600000
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `bytebot.enabled` | boolean | `true` | Enable/disable Bytebot adapter |
| `bytebot.maxConcurrentDelegations` | number | `3` | Maximum concurrent delegations |
| `bytebot.delegationTimeout` | number | `300000` | Delegation timeout (5 minutes) |
| `bytebot.autoCleanupCompletedAfter` | number | `3600000` | Auto-cleanup delay (1 hour) |

## Delegation Workflow

### 1. Delegation Request

External agents send delegation requests via the API:

```typescript
interface DelegationRequest {
  delegation_id: string;
  bytebot_task_id: string;
  task_description: string;
  context?: {
    workspace_path?: string;
    relevant_files?: string[];
    mode?: string;
  };
  interaction_mode: 'blocking' | 'autonomous' | 'interactive';
  timeout?: number;
}
```

### 2. Task Lifecycle

The adapter manages the complete delegation lifecycle:

1. **Create Delegation**: Initialize delegation state
2. **Start Roo-Code Task**: Launch task with configuration
3. **Monitor Progress**: Track Roo-Code events
4. **Handle Questions**: Manage interactive prompts (if any)
5. **Complete/Fail**: Finalize delegation and cleanup

### 3. Delegation Events

The adapter emits events to connected WebSocket clients:

```typescript
interface DelegationEvent {
  type: 'delegation_started' | 'delegation_progress' | 
        'delegation_completed' | 'delegation_error' | 
        'delegation_cancelled';
  delegation_id: string;
  bytebot_task_id: string;
  timestamp: number;
  payload: {
    status?: DelegationStatus;
    message?: string;
    progress?: number;
    error?: string;
    result?: DelegationResult;
  };
}
```

## Delegation Status

Delegations can be in one of the following states:

- **PENDING**: Delegation created, not yet started
- **IN_PROGRESS**: Roo-Code task is actively running
- **COMPLETED**: Task completed successfully
- **FAILED**: Task failed with error
- **CANCELLED**: Task was cancelled by user or system

## API Integration

### Creating a Delegation

```javascript
// Example: Create a new delegation
const response = await fetch('http://localhost:3737/delegations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    delegation_id: 'del-123',
    bytebot_task_id: 'task-456',
    task_description: 'Add error handling to the authentication module',
    context: {
      mode: 'code',
      relevant_files: ['src/auth/login.ts']
    },
    interaction_mode: 'autonomous'
  })
});

const result = await response.json();
// { delegation_id, roo_task_id, status, message }
```

### Monitoring Delegation Events

```javascript
// Connect to WebSocket for real-time events
const ws = new WebSocket('ws://localhost:3737/events');

ws.onopen = () => {
  // Subscribe to delegation events
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: ['message'] // Delegation events come through 'message'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'event' && data.eventName === 'message') {
    const payload = data.payload[0];
    if (payload.type === 'delegation_event') {
      const delegationEvent = payload.event;
      console.log('Delegation event:', delegationEvent);
    }
  }
};
```

### Sending Messages to Delegation

```javascript
// Send a message to an active delegation
await fetch('http://localhost:3737/delegations/del-123/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Use async/await instead of promises'
  })
});
```

### Cancelling a Delegation

```javascript
// Cancel an active delegation
await fetch('http://localhost:3737/delegations/del-123/cancel', {
  method: 'POST'
});
```

## Interaction Modes

The adapter supports three interaction modes:

### 1. Autonomous Mode
- Task runs completely autonomously
- No user interaction required
- Best for well-defined tasks

### 2. Blocking Mode
- Agent waits for task completion
- Returns result when done
- Suitable for synchronous workflows

### 3. Interactive Mode
- Task may require user input
- Questions are forwarded to agent
- Agent must respond to questions
- Best for complex, multi-step tasks

## Error Handling

The adapter handles various error scenarios:

### Timeout Handling
```typescript
// Delegations automatically timeout after configured duration
// Default: 5 minutes (300000 ms)
// Timeout triggers 'delegation_error' event
```

### Roo-Code Not Ready
```typescript
// Adapter checks if Roo-Code is ready before delegation
// Throws error if Roo-Code API is not available
```

### Task Failure
```typescript
// Roo-Code task failures are captured
// Converted to delegation_error events
// Error details included in event payload
```

## Statistics and Monitoring

Get adapter statistics:

```javascript
const stats = bytebotAdapter.getStats();
// {
//   enabled: true,
//   delegations: {
//     active: 2,
//     completed: 15,
//     failed: 1,
//     cancelled: 0
//   },
//   questions: {
//     pending: 0,
//     resolved: 8
//   }
// }
```

## Cleanup

The adapter automatically cleans up completed delegations:

- Completed delegations are retained for configured duration (default: 1 hour)
- After cleanup delay, delegation state is removed
- Manual cleanup can be triggered: `bytebotAdapter.cleanup()`

## Best Practices

### 1. Unique Delegation IDs
Always use unique delegation IDs to avoid conflicts:
```typescript
const delegationId = `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 2. Timeout Configuration
Set appropriate timeouts based on task complexity:
```typescript
// Simple tasks: 2-5 minutes
// Complex tasks: 10-30 minutes
// Very complex: up to 60 minutes
```

### 3. Event Subscription
Subscribe to specific events to reduce noise:
```typescript
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['message'] // Only delegation events
}));
```

### 4. Error Recovery
Implement retry logic for failed delegations:
```typescript
async function delegateWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createDelegation(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

## Troubleshooting

### Delegation Not Starting
- Check if Roo-Code extension is installed and active
- Verify Zupervizor is connected to Roo-Code (check status bar)
- Ensure `bytebot.enabled` is `true` in settings

### Events Not Received
- Verify WebSocket connection is established
- Check event subscription includes 'message' event
- Ensure delegation_id matches the created delegation

### Delegation Timeout
- Increase `delegationTimeout` for complex tasks
- Check Roo-Code logs for task errors
- Verify task description is clear and actionable

## Examples

### Complete Integration Example

```typescript
import WebSocket from 'ws';

class BytebotClient {
  private ws: WebSocket;
  private apiUrl: string = 'http://localhost:3737';
  
  constructor() {
    this.ws = new WebSocket('ws://localhost:3737/events');
    this.setupWebSocket();
  }
  
  private setupWebSocket() {
    this.ws.on('open', () => {
      // Subscribe to delegation events
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        events: ['message']
      }));
    });
    
    this.ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      this.handleEvent(event);
    });
  }
  
  private handleEvent(event: any) {
    if (event.type === 'event' && event.eventName === 'message') {
      const payload = event.payload[0];
      if (payload.type === 'delegation_event') {
        const delEvent = payload.event;
        console.log(`[${delEvent.delegation_id}] ${delEvent.type}:`, delEvent.payload);
      }
    }
  }
  
  async delegateTask(taskDescription: string): Promise<string> {
    const delegationId = `del-${Date.now()}`;
    
    const response = await fetch(`${this.apiUrl}/delegations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delegation_id: delegationId,
        bytebot_task_id: `bytebot-task-${Date.now()}`,
        task_description: taskDescription,
        context: { mode: 'code' },
        interaction_mode: 'autonomous'
      })
    });
    
    const result = await response.json();
    return result.delegation_id;
  }
  
  close() {
    this.ws.close();
  }
}

// Usage
const client = new BytebotClient();
const delegationId = await client.delegateTask(
  'Refactor the user service to use dependency injection'
);
console.log('Delegation created:', delegationId);
```

## Future Enhancements

Planned features for the Bytebot adapter:

- [ ] Question/answer flow for interactive delegations
- [ ] Multi-file context support
- [ ] Delegation result file diff tracking
- [ ] Delegation history and analytics
- [ ] Authentication for external agents
- [ ] Rate limiting and quota management
- [ ] Delegation priority queuing

## See Also

- [API Documentation](api-documentation.md) - Complete API reference
- [Architecture Plan](architecture-plan.md) - System architecture details
- [Quick Start Guide](quick-start.md) - Getting started guide