/**
 * Event normalizer for transforming Roo-Code events to Bytebot events
 */

import { RooCodeEventName, MessageEvent } from '../roo-code/types';
import { DelegationEvent, DelegationState, DelegationStatus } from './types';
import { Logger } from '../logging/logger';

export class EventNormalizer {
  private logger: Logger;
  private completionResults: Map<string, string>; // Map delegation_id to completion result
  private taskCompletedReceived: Map<string, boolean>; // Track if taskCompleted event was received

  constructor() {
    this.logger = new Logger('EventNormalizer');
    this.completionResults = new Map();
    this.taskCompletedReceived = new Map();
  }

  /**
   * Normalize a Roo-Code event into a Bytebot delegation event
   */
  normalize(
    rooEventName: RooCodeEventName,
    rooEventData: unknown,
    delegation: DelegationState,
  ): DelegationEvent | null {
    try {
      // Map Roo-Code events to delegation events
      switch (rooEventName) {
        case 'taskCreated':
          return this.normalizeTaskCreated(rooEventData, delegation);

        case 'taskStarted':
          return this.normalizeTaskStarted(rooEventData, delegation);

        case 'taskCompleted':
          return this.normalizeTaskCompleted(rooEventData, delegation);

        case 'taskAborted':
          return this.normalizeTaskAborted(rooEventData, delegation);

        case 'message':
          return this.normalizeMessage(rooEventData as MessageEvent, delegation);

        case 'taskToolFailed':
          return this.normalizeToolFailed(rooEventData, delegation);

        default:
          // Don't normalize unhandled events
          return null;
      }
    } catch (error) {
      this.logger.error(`Failed to normalize event ${rooEventName}:`, error);
      return null;
    }
  }

  /**
   * Check if event type can be normalized
   */
  canNormalize(eventType: RooCodeEventName): boolean {
    const normalizable: RooCodeEventName[] = [
      'taskCreated',
      'taskStarted',
      'taskCompleted',
      'taskAborted',
      'message',
      'taskToolFailed',
    ];
    return normalizable.includes(eventType);
  }

  /**
   * Normalize taskCreated event
   */
  private normalizeTaskCreated(
    data: unknown,
    delegation: DelegationState,
  ): DelegationEvent {
    return {
      type: 'delegation_started',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.IN_PROGRESS,
        message: 'Task created and started',
      },
    };
  }

  /**
   * Normalize taskStarted event
   */
  private normalizeTaskStarted(
    data: unknown,
    delegation: DelegationState,
  ): DelegationEvent {
    return {
      type: 'delegation_progress',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.IN_PROGRESS,
        message: 'Task execution started',
      },
    };
  }

  /**
   * Normalize taskCompleted event
   * Only sends delegation_completed when both taskCompleted event AND final completion result have been received
   */
  private normalizeTaskCompleted(
    data: unknown,
    delegation: DelegationState,
  ): DelegationEvent | null {
    // Mark that taskCompleted event was received
    this.taskCompletedReceived.set(delegation.delegation_id, true);
    this.logger.info(`taskCompleted received for delegation ${delegation.delegation_id}`);

    // Check if we also have the completion result
    const completionResult = this.completionResults.get(delegation.delegation_id);

    if (!completionResult) {
      // We don't have the completion result yet, wait for it
      this.logger.info(`Waiting for completion result for delegation ${delegation.delegation_id}`);
      return null;
    }

    // We have both taskCompleted and completion result, send the event
    this.logger.info(
      'Both taskCompleted and completion result received for delegation ' +
      `${delegation.delegation_id}, sending delegation_completed`,
    );

    const duration = delegation.completed_at
      ? delegation.completed_at - delegation.created_at
      : undefined;

    // Clean up stored data
    this.completionResults.delete(delegation.delegation_id);
    this.taskCompletedReceived.delete(delegation.delegation_id);

    return {
      type: 'delegation_completed',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.COMPLETED,
        message: 'Task completed successfully',
        result: {
          delegation_id: delegation.delegation_id,
          status: DelegationStatus.COMPLETED,
          result: completionResult,
          duration,
        },
      },
    };
  }

  /**
   * Normalize taskAborted event
   */
  private normalizeTaskAborted(
    data: unknown,
    delegation: DelegationState,
  ): DelegationEvent {
    return {
      type: 'delegation_cancelled',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.CANCELLED,
        message: 'Task was cancelled',
      },
    };
  }

  /**
   * Normalize message event (for progress updates only)
   * Note: Completion events are handled by taskCompleted to avoid duplicates
   */
  private normalizeMessage(
    data: MessageEvent,
    delegation: DelegationState,
  ): DelegationEvent | null {
    // Only normalize say messages that are created or updated
    if (data.message?.type !== 'say') {
      return null;
    }

    const message = data.message.say ?? data.message.text ?? 'Working...';
    const isPartial = data.message.partial !== false; // Default to true if not specified

    // Store completion result for later use in taskCompleted event
    // This avoids sending duplicate completion events
    // When partial is false and say is 'completion_result', this is the final result
    if (data.message.say === 'completion_result' && !isPartial) {
      const resultText = data.message.text ?? 'Task completed successfully';
      this.completionResults.set(delegation.delegation_id, resultText);
      this.logger.info(
        `Stored completion result for delegation ${delegation.delegation_id}: ` +
        `${resultText.substring(0, 100)}...`,
      );

      // Check if we already received taskCompleted event
      const taskCompleted = this.taskCompletedReceived.get(delegation.delegation_id);

      if (taskCompleted) {
        // We have both completion result and taskCompleted, send the event now
        this.logger.info(
          'Both completion result and taskCompleted received for delegation ' +
          `${delegation.delegation_id}, sending delegation_completed`,
        );

        const duration = delegation.completed_at
          ? delegation.completed_at - delegation.created_at
          : undefined;

        // Clean up stored data
        this.completionResults.delete(delegation.delegation_id);
        this.taskCompletedReceived.delete(delegation.delegation_id);

        return {
          type: 'delegation_completed',
          delegation_id: delegation.delegation_id,
          bytebot_task_id: delegation.bytebot_task_id,
          timestamp: Date.now(),
          payload: {
            status: DelegationStatus.COMPLETED,
            message: 'Task completed successfully',
            result: {
              delegation_id: delegation.delegation_id,
              status: DelegationStatus.COMPLETED,
              result: resultText,
              duration,
            },
          },
        };
      }

      // Don't send event yet - wait for taskCompleted
      return null;
    }

    // Regular progress update for other messages
    if (data.action === 'created') {
      return {
        type: 'delegation_progress',
        delegation_id: delegation.delegation_id,
        bytebot_task_id: delegation.bytebot_task_id,
        timestamp: Date.now(),
        payload: {
          status: DelegationStatus.IN_PROGRESS,
          message,
        },
      };
    }

    return null;
  }

  /**
   * Normalize tool failed event
   */
  private normalizeToolFailed(
    data: unknown,
    delegation: DelegationState,
  ): DelegationEvent {
    const errorMessage = (data as { error?: string })?.error ?? 'Tool execution failed';

    return {
      type: 'delegation_error',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.FAILED,
        error: errorMessage,
        message: `Error during task execution: ${errorMessage}`,
      },
    };
  }

  /**
   * Create a generic progress event
   */
  createProgressEvent(
    delegation: DelegationState,
    message: string,
  ): DelegationEvent {
    return {
      type: 'delegation_progress',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.IN_PROGRESS,
        message,
      },
    };
  }

  /**
   * Create an error event
   */
  createErrorEvent(
    delegation: DelegationState,
    error: string,
  ): DelegationEvent {
    return {
      type: 'delegation_error',
      delegation_id: delegation.delegation_id,
      bytebot_task_id: delegation.bytebot_task_id,
      timestamp: Date.now(),
      payload: {
        status: DelegationStatus.FAILED,
        error,
        message: `Error: ${error}`,
      },
    };
  }

  /**
   * Clear stored completion result for a delegation
   * Useful for cleanup when delegation is cancelled or fails
   */
  clearCompletionResult(delegationId: string): void {
    this.completionResults.delete(delegationId);
    this.taskCompletedReceived.delete(delegationId);
  }

  /**
   * Get statistics about stored completion results
   */
  getStats(): { pendingResults: number; pendingTaskCompleted: number } {
    return {
      pendingResults: this.completionResults.size,
      pendingTaskCompleted: this.taskCompletedReceived.size,
    };
  }
}
