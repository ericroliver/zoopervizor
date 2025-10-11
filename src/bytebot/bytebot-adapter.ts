/**
 * Bytebot adapter orchestrator for managing delegations
 */

import { RooCodeController } from '../roo-code/controller';
import { RooCodeEventName, TaskOptions } from '../roo-code/types';
import { WebSocketHandler } from '../api/websocket';
import { Logger } from '../logging/logger';
import { EventNormalizer } from './event-normalizer';
import { TaskCoordinator } from './task-coordinator';
import { QuestionHandler } from './question-handler';
import {
  DelegationRequest,
  DelegationResponse,
  DelegationStatus,
  DelegationState,
  DelegationEvent,
} from './types';

export class BytebotAdapter {
  private rooCodeController: RooCodeController;
  private websocketHandler: WebSocketHandler;
  private eventNormalizer: EventNormalizer;
  private taskCoordinator: TaskCoordinator;
  private questionHandler: QuestionHandler;
  private logger: Logger;
  private enabled: boolean;

  constructor(
    rooCodeController: RooCodeController,
    websocketHandler: WebSocketHandler
  ) {
    this.rooCodeController = rooCodeController;
    this.websocketHandler = websocketHandler;
    this.eventNormalizer = new EventNormalizer();
    this.taskCoordinator = new TaskCoordinator();
    this.questionHandler = new QuestionHandler();
    this.logger = new Logger('BytebotAdapter');
    this.enabled = false;
  }

  /**
   * Initialize the adapter
   */
  initialize(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.logger.info('Bytebot adapter initialized and enabled');
      // Setup Roo-Code event listeners
      this.setupEventListeners();
    } else {
      this.logger.info('Bytebot adapter initialized but disabled');
    }
  }

  /**
   * Check if adapter is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Delegate a coding task
   */
  async delegateTask(request: DelegationRequest): Promise<DelegationResponse> {
    if (!this.enabled) {
      throw new Error('Bytebot integration is not enabled');
    }

    if (!this.rooCodeController.isReady()) {
      throw new Error('Roo-Code is not ready');
    }

    this.logger.info(`New delegation request: ${request.delegation_id} from task ${request.bytebot_task_id}`);

    try {
      // Create delegation state
      const delegation = this.taskCoordinator.createDelegation(request);

      // Prepare Roo-Code task options
      const taskOptions: TaskOptions = {
        text: request.task_description,
        newTab: true,
      };

      // Set mode if specified
      if (request.context?.mode) {
        taskOptions.configuration = {
          mode: request.context.mode,
        };
      }

      // Start the Roo-Code task
      const rooTaskId = await this.rooCodeController.startNewTask(taskOptions);
      
      // Link the Roo task to the delegation
      this.taskCoordinator.linkRooTask(request.delegation_id, rooTaskId);
      this.taskCoordinator.updateStatus(request.delegation_id, DelegationStatus.IN_PROGRESS);

      this.logger.info(`Delegation ${request.delegation_id} linked to Roo task ${rooTaskId}`);

      // Emit delegation started event
      const startedEvent = this.eventNormalizer.createProgressEvent(
        delegation,
        'Delegation started'
      );
      this.broadcastDelegationEvent(startedEvent);

      return {
        delegation_id: request.delegation_id,
        roo_task_id: rooTaskId,
        status: DelegationStatus.IN_PROGRESS,
        message: 'Delegation created and task started',
      };
    } catch (error) {
      this.logger.error(`Failed to delegate task ${request.delegation_id}:`, error);
      
      // Update delegation status
      const delegation = this.taskCoordinator.getDelegation(request.delegation_id);
      if (delegation) {
        this.taskCoordinator.updateStatus(
          request.delegation_id,
          DelegationStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error'
        );

        // Emit error event
        const errorEvent = this.eventNormalizer.createErrorEvent(
          delegation,
          error instanceof Error ? error.message : 'Unknown error'
        );
        this.broadcastDelegationEvent(errorEvent);
      }

      throw error;
    }
  }

  /**
   * Send a message to a delegation
   */
  async sendMessage(delegationId: string, message: string): Promise<void> {
    const delegation = this.taskCoordinator.getDelegation(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    if (!delegation.roo_task_id) {
      throw new Error(`Delegation ${delegationId} has no associated Roo task`);
    }

    try {
      await this.rooCodeController.sendMessage(message);
      this.logger.info(`Sent message to delegation ${delegationId}`);
    } catch (error) {
      this.logger.error(`Failed to send message to delegation ${delegationId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a delegation
   */
  async cancelDelegation(delegationId: string): Promise<void> {
    const delegation = this.taskCoordinator.getDelegation(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    try {
      // Cancel the Roo-Code task if it exists
      if (delegation.roo_task_id) {
        const currentStack = this.rooCodeController.getCurrentTaskStack();
        if (currentStack.includes(delegation.roo_task_id)) {
          await this.rooCodeController.cancelCurrentTask();
        }
      }

      // Update delegation status
      this.taskCoordinator.cancelDelegation(delegationId);

      // Emit cancellation event
      const event: DelegationEvent = {
        type: 'delegation_cancelled',
        delegation_id: delegationId,
        bytebot_task_id: delegation.bytebot_task_id,
        timestamp: Date.now(),
        payload: {
          status: DelegationStatus.CANCELLED,
          message: 'Delegation cancelled',
        },
      };
      this.broadcastDelegationEvent(event);

      this.logger.info(`Cancelled delegation ${delegationId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel delegation ${delegationId}:`, error);
      throw error;
    }
  }

  /**
   * Get delegation status
   */
  getDelegationStatus(delegationId: string): DelegationState | undefined {
    return this.taskCoordinator.getDelegation(delegationId);
  }

  /**
   * Get all active delegations
   */
  getActiveDelegations(): DelegationState[] {
    return this.taskCoordinator.getActiveDelegations();
  }

  /**
   * Setup Roo-Code event listeners
   */
  private setupEventListeners(): void {
    // Note: Event listeners would be set up on the Roo-Code API
    // This is a placeholder for Phase 2 implementation
    this.logger.info('Event listeners setup completed');
  }

  /**
   * Handle Roo-Code events
   */
  handleRooCodeEvent(eventName: RooCodeEventName, eventData: any): void {
    if (!this.enabled) {
      return;
    }

    // Find the delegation associated with this event
    // For taskCreated/taskStarted, eventData.taskId should be present
    let delegation: DelegationState | undefined;

    if (eventData.taskId) {
      delegation = this.taskCoordinator.getDelegationByRooTask(eventData.taskId);
    }

    if (!delegation) {
      // Event not related to a delegation, ignore
      return;
    }

    // Normalize the event
    const delegationEvent = this.eventNormalizer.normalize(
      eventName,
      eventData,
      delegation
    );

    if (!delegationEvent) {
      // Event couldn't be normalized or isn't relevant
      return;
    }

    // Update delegation status based on event
    this.updateDelegationFromEvent(delegation, delegationEvent);

    // Broadcast the event to Bytebot clients
    this.broadcastDelegationEvent(delegationEvent);
  }

  /**
   * Update delegation state based on event
   */
  private updateDelegationFromEvent(
    delegation: DelegationState,
    event: DelegationEvent
  ): void {
    switch (event.type) {
      case 'delegation_completed':
        this.taskCoordinator.updateStatus(
          delegation.delegation_id,
          DelegationStatus.COMPLETED
        );
        break;

      case 'delegation_error':
        this.taskCoordinator.updateStatus(
          delegation.delegation_id,
          DelegationStatus.FAILED,
          event.payload.error
        );
        break;

      case 'delegation_cancelled':
        this.taskCoordinator.updateStatus(
          delegation.delegation_id,
          DelegationStatus.CANCELLED
        );
        break;
    }
  }

  /**
   * Broadcast delegation event to WebSocket clients
   */
  private broadcastDelegationEvent(event: DelegationEvent): void {
    try {
      // Broadcast as a special delegation event type
      this.websocketHandler.broadcastEvent('message' as RooCodeEventName, [
        {
          type: 'delegation_event',
          event,
        },
      ]);
      this.logger.debug(`Broadcast delegation event: ${event.type} for ${event.delegation_id}`);
    } catch (error) {
      this.logger.error('Failed to broadcast delegation event:', error);
    }
  }

  /**
   * Get adapter statistics
   */
  getStats(): {
    enabled: boolean;
    delegations: any;
    questions: any;
  } {
    return {
      enabled: this.enabled,
      delegations: this.taskCoordinator.getStats(),
      questions: this.questionHandler.getStats(),
    };
  }

  /**
   * Cleanup old delegations
   */
  cleanup(): void {
    const cleaned = this.taskCoordinator.cleanupCompleted();
    const questionsCleared = this.questionHandler.cleanupOld();
    
    if (cleaned > 0 || questionsCleared > 0) {
      this.logger.info(`Cleanup: ${cleaned} delegations, ${questionsCleared} questions`);
    }
  }
}