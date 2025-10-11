/**
 * Event normalizer for transforming Roo-Code events to Bytebot events
 */

import { RooCodeEventName, MessageEvent } from '../roo-code/types';
import { DelegationEvent, DelegationState, DelegationStatus } from './types';
import { Logger } from '../logging/logger';

export class EventNormalizer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('EventNormalizer');
  }

  /**
   * Normalize a Roo-Code event into a Bytebot delegation event
   */
  normalize(
    rooEventName: RooCodeEventName,
    rooEventData: any,
    delegation: DelegationState
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
          return this.normalizeMessage(rooEventData, delegation);

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
    data: any,
    delegation: DelegationState
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
    data: any,
    delegation: DelegationState
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
   */
  private normalizeTaskCompleted(
    data: any,
    delegation: DelegationState
  ): DelegationEvent {
    const duration = delegation.completed_at
      ? delegation.completed_at - delegation.created_at
      : undefined;

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
          result: delegation.result?.result,
          duration,
        },
      },
    };
  }

  /**
   * Normalize taskAborted event
   */
  private normalizeTaskAborted(
    data: any,
    delegation: DelegationState
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
   * Normalize message event (for progress updates)
   */
  private normalizeMessage(
    data: MessageEvent,
    delegation: DelegationState
  ): DelegationEvent | null {
    // Only normalize assistant messages
    if (data.message?.type !== 'say' || data.action !== 'created') {
      return null;
    }

    const message = data.message.say || data.message.text || 'Working...';

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
   * Normalize tool failed event
   */
  private normalizeToolFailed(
    data: any,
    delegation: DelegationState
  ): DelegationEvent {
    const errorMessage = data.error || 'Tool execution failed';

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
    message: string
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
    error: string
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
}