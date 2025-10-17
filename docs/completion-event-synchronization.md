# Completion Event Synchronization

## Problem

The Bytebot event log showed that events were arriving in this order:
1. `taskCompleted` event
2. `completion_result` message with `partial=false`

This caused the system to send the `delegation_completed` message prematurely, before receiving the full completion result text.

## Solution

Implemented a two-phase completion tracking system in [`EventNormalizer`](../src/bytebot/event-normalizer.ts) that requires **both** conditions to be met before sending the `delegation_completed` event:

1. **taskCompleted event received** - Indicates the task has finished
2. **Final completion result received** - The `completion_result` message with `partial=false` containing the actual result text

## Implementation Details

### New Tracking Map

Added `taskCompletedReceived: Map<string, boolean>` to track when the `taskCompleted` event has been received for each delegation.

### Modified Methods

#### [`normalizeTaskCompleted()`](../src/bytebot/event-normalizer.ts:116)
- Marks that `taskCompleted` was received
- Checks if completion result is already available
- Only sends `delegation_completed` if both conditions are met
- Returns `null` if waiting for completion result

#### [`normalizeMessage()`](../src/bytebot/event-normalizer.ts:185)
- Stores completion result when `completion_result` with `partial=false` is received
- Checks if `taskCompleted` was already received
- Sends `delegation_completed` immediately if both conditions are met
- Returns `null` if waiting for `taskCompleted` event

#### [`clearCompletionResult()`](../src/bytebot/event-normalizer.ts:324)
- Now clears both completion results and taskCompleted tracking
- Used during cancellation or error cleanup

#### [`getStats()`](../src/bytebot/event-normalizer.ts:332)
- Returns both `pendingResults` and `pendingTaskCompleted` counts
- Useful for monitoring and debugging

## Event Flow

### Scenario 1: taskCompleted arrives first
```
1. taskCompleted event → Mark as received, wait for result
2. completion_result (partial=false) → Both conditions met, send delegation_completed
```

### Scenario 2: completion_result arrives first
```
1. completion_result (partial=false) → Store result, wait for taskCompleted
2. taskCompleted event → Both conditions met, send delegation_completed
```

## Benefits

- **No premature completion events** - Ensures Bytebot receives the full result text
- **Order-independent** - Works regardless of which event arrives first
- **Clean synchronization** - Simple two-phase tracking mechanism
- **Proper cleanup** - Clears tracking data after sending completion event

## Testing Considerations

When testing, verify:
1. Completion events are only sent after both conditions are met
2. The result text is included in the `delegation_completed` event
3. Cleanup properly removes tracking data
4. Cancellation clears both tracking maps