# Delegation Events Flow

This document describes how delegation events flow from Bytebot through Zupervizor and back to the WebSocket client.

## Architecture Overview

```
Bytebot Client (WebSocket)
    ↓ (delegate_task message)
WebSocketHandler
    ↓
RooCodeController.startNewTask()
    ↓
Roo-Code Extension
    ↓ (emits events: taskCreated, message, taskCompleted, etc.)
RooCodeListener
    ↓
extension.ts (setupEventForwarding)
    ↓
BytebotAdapter.handleRooCodeEvent()
    ↓
EventNormalizer.normalize()
    ↓
WebSocketHandler.broadcastDelegationEvent()
    ↓
Bytebot Client (receives DelegationEvent)
```

## Event Flow Details

### 1. Delegation Request (Bytebot → Zupervizor)

When Bytebot wants to delegate a task, it sends a WebSocket message:

```typescript
{
  type: 'delegate_task',
  delegation_id: 'unique-id',
  bytebot_task_id: 'bytebot-task-id',
  task_description: 'Task to perform',
  context: {
    mode: 'code',
    relevant_files: ['file1.ts', 'file2.ts']
  },
  interaction_mode: 'autonomous',
  timeout: 300000
}
```

### 2. Task Creation

The `WebSocketHandler` receives the delegation request and:
1. Creates a Roo-Code task via `RooCodeController.startNewTask()`
2. Returns a delegation response with the Roo task ID

### 3. Event Monitoring

As the Roo-Code task executes, it emits various events:
- `taskCreated` - Task is created
- `taskStarted` - Task execution begins
- `message` - Progress updates from the AI
- `taskCompleted` - Task finishes successfully
- `taskAborted` - Task is cancelled
- `taskToolFailed` - A tool execution fails

### 4. Event Normalization

The `BytebotAdapter` receives these Roo-Code events and:
1. Identifies which delegation the event belongs to (via task ID mapping)
2. Passes the event to `EventNormalizer.normalize()`
3. Transforms Roo-Code events into `DelegationEvent` format

### 5. Delegation Events (Zupervizor → Bytebot)

The normalized events are broadcast back to WebSocket clients:

```typescript
interface DelegationEvent {
  type: 'delegation_started' | 'delegation_progress' | 'delegation_completed' | 'delegation_error' | 'delegation_cancelled';
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

## Event Type Mapping

| Roo-Code Event | Delegation Event Type | Description |
|----------------|----------------------|-------------|
| `taskCreated` | `delegation_started` | Task has been created and is starting |
| `taskStarted` | `delegation_progress` | Task execution has begun |
| `message` (type: 'say') | `delegation_progress` | AI is providing progress updates |
| `taskCompleted` | `delegation_completed` | Task finished successfully |
| `taskAborted` | `delegation_cancelled` | Task was cancelled |
| `taskToolFailed` | `delegation_error` | A tool execution failed |

## WebSocket Message Format

Delegation events are sent to WebSocket clients in this format:

```typescript
{
  type: 'event',
  eventName: 'delegation_event',
  payload: [
    {
      type: 'delegation_progress',
      delegation_id: 'unique-id',
      bytebot_task_id: 'bytebot-task-id',
      timestamp: 1760288324272,
      payload: {
        status: 'in_progress',
        message: 'Working on the task...'
      }
    }
  ],
  timestamp: '2025-10-12T16:58:45.037Z'
}
```

## Key Components

### BytebotAdapter
- Orchestrates the delegation lifecycle
- Maintains delegation state
- Handles Roo-Code event forwarding
- Broadcasts delegation events

### EventNormalizer
- Transforms Roo-Code events into delegation events
- Filters relevant events
- Enriches events with delegation context

### TaskCoordinator
- Manages delegation state
- Links Roo tasks to delegations
- Tracks delegation status
- Handles timeouts

### WebSocketHandler
- Manages WebSocket connections
- Broadcasts events to subscribed clients
- Handles delegation event broadcasting via `broadcastDelegationEvent()`

## Example Flow

1. **Bytebot sends delegation request:**
   ```json
   {
     "type": "delegate_task",
     "delegation_id": "del-123",
     "bytebot_task_id": "task-456",
     "task_description": "Fix the bug in app.ts"
   }
   ```

2. **Zupervizor creates Roo task and responds:**
   ```json
   {
     "type": "delegation_response",
     "delegation_id": "del-123",
     "roo_task_id": "roo-789",
     "status": "started"
   }
   ```

3. **Roo-Code emits events, Zupervizor forwards as delegation events:**
   ```json
   {
     "type": "event",
     "eventName": "delegation_event",
     "payload": [{
       "type": "delegation_progress",
       "delegation_id": "del-123",
       "bytebot_task_id": "task-456",
       "timestamp": 1760288324272,
       "payload": {
         "status": "in_progress",
         "message": "Analyzing the bug..."
       }
     }]
   }
   ```

4. **Task completes:**
   ```json
   {
     "type": "event",
     "eventName": "delegation_event",
     "payload": [{
       "type": "delegation_completed",
       "delegation_id": "del-123",
       "bytebot_task_id": "task-456",
       "timestamp": 1760288350000,
       "payload": {
         "status": "completed",
         "message": "Task completed successfully",
         "result": {
           "delegation_id": "del-123",
           "status": "completed",
           "duration": 25728
         }
       }
     }]
   }
   ```

## Subscription

Clients can subscribe to delegation events:

```typescript
// Subscribe to all events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['delegation_event']
}));

// Or subscribe to all events (default)
ws.send(JSON.stringify({
  type: 'subscribe',
  events: []
}));
```

## Error Handling

If an error occurs during delegation:

```json
{
  "type": "event",
  "eventName": "delegation_event",
  "payload": [{
    "type": "delegation_error",
    "delegation_id": "del-123",
    "bytebot_task_id": "task-456",
    "timestamp": 1760288340000,
    "payload": {
      "status": "failed",
      "error": "Tool execution failed",
      "message": "Error during task execution: Tool execution failed"
    }
  }]
}