/**
 * Task coordinator for managing delegation lifecycle
 */

import { DelegationRequest, DelegationState, DelegationStatus, DelegationResult } from './types';
import { Logger } from '../logging/logger';

export class TaskCoordinator {
  private logger: Logger;
  private delegations: Map<string, DelegationState>;
  private rooTaskToDelegation: Map<string, string>; // Map Roo task ID to delegation ID

  constructor() {
    this.logger = new Logger('TaskCoordinator');
    this.delegations = new Map();
    this.rooTaskToDelegation = new Map();
  }

  /**
   * Create a new delegation
   */
  createDelegation(request: DelegationRequest): DelegationState {
    const delegation: DelegationState = {
      delegation_id: request.delegation_id,
      bytebot_task_id: request.bytebot_task_id,
      status: DelegationStatus.PENDING,
      interaction_mode: request.interaction_mode,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    this.delegations.set(request.delegation_id, delegation);
    this.logger.info(`Created delegation ${request.delegation_id} for task ${request.bytebot_task_id}`);

    // Set timeout if specified
    if (request.timeout) {
      delegation.timeout = setTimeout(() => {
        this.handleTimeout(request.delegation_id);
      }, request.timeout);
    }

    return delegation;
  }

  /**
   * Link a Roo-Code task to a delegation
   */
  linkRooTask(delegationId: string, rooTaskId: string): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    delegation.roo_task_id = rooTaskId;
    delegation.updated_at = Date.now();
    this.rooTaskToDelegation.set(rooTaskId, delegationId);

    this.logger.info(`Linked Roo task ${rooTaskId} to delegation ${delegationId}`);
  }

  /**
   * Update delegation status
   */
  updateStatus(delegationId: string, status: DelegationStatus, error?: string): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    delegation.status = status;
    delegation.updated_at = Date.now();

    if (error) {
      delegation.error = error;
    }

    if (status === DelegationStatus.COMPLETED
        || status === DelegationStatus.FAILED
        || status === DelegationStatus.CANCELLED) {
      delegation.completed_at = Date.now();
      this.clearTimeout(delegationId);
    }

    this.logger.info(`Updated delegation ${delegationId} status to ${status}`);
  }

  /**
   * Set delegation result
   */
  setResult(delegationId: string, result: DelegationResult): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    delegation.result = result;
    delegation.updated_at = Date.now();
  }

  /**
   * Get delegation by ID
   */
  getDelegation(delegationId: string): DelegationState | undefined {
    return this.delegations.get(delegationId);
  }

  /**
   * Get delegation by Roo task ID
   */
  getDelegationByRooTask(rooTaskId: string): DelegationState | undefined {
    const delegationId = this.rooTaskToDelegation.get(rooTaskId);
    if (!delegationId) {
      return undefined;
    }
    return this.delegations.get(delegationId);
  }

  /**
   * Get all active delegations
   */
  getActiveDelegations(): DelegationState[] {
    return Array.from(this.delegations.values()).filter(
      d => d.status === DelegationStatus.PENDING || d.status === DelegationStatus.IN_PROGRESS,
    );
  }

  /**
   * Cancel a delegation
   */
  cancelDelegation(delegationId: string): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    if (delegation.status === DelegationStatus.COMPLETED || delegation.status === DelegationStatus.FAILED) {
      throw new Error(`Cannot cancel delegation ${delegationId} with status ${delegation.status}`);
    }

    this.updateStatus(delegationId, DelegationStatus.CANCELLED);
    this.logger.info(`Cancelled delegation ${delegationId}`);
  }

  /**
   * Clean up completed delegations
   */
  cleanupCompleted(olderThanMs: number = 3600000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [delegationId, delegation] of this.delegations.entries()) {
      if (
        delegation.completed_at &&
        now - delegation.completed_at > olderThanMs &&
        (delegation.status === DelegationStatus.COMPLETED ||
          delegation.status === DelegationStatus.FAILED ||
          delegation.status === DelegationStatus.CANCELLED)
      ) {
        // Remove from maps
        if (delegation.roo_task_id) {
          this.rooTaskToDelegation.delete(delegation.roo_task_id);
        }
        this.delegations.delete(delegationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} completed delegations`);
    }

    return cleanedCount;
  }

  /**
   * Handle delegation timeout
   */
  private handleTimeout(delegationId: string): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      return;
    }

    if (delegation.status === DelegationStatus.PENDING || delegation.status === DelegationStatus.IN_PROGRESS) {
      this.logger.warn(`Delegation ${delegationId} timed out`);
      delegation.status = DelegationStatus.FAILED;
      delegation.error = 'Delegation timed out';
      delegation.completed_at = Date.now();
      delegation.updated_at = Date.now();
    }
  }

  /**
   * Clear timeout for a delegation
   */
  private clearTimeout(delegationId: string): void {
    const delegation = this.delegations.get(delegationId);
    if (delegation?.timeout) {
      clearTimeout(delegation.timeout);
      delegation.timeout = undefined;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    } {
    const delegations = Array.from(this.delegations.values());
    return {
      total: delegations.length,
      active: delegations.filter(d => d.status === DelegationStatus.IN_PROGRESS).length,
      completed: delegations.filter(d => d.status === DelegationStatus.COMPLETED).length,
      failed: delegations.filter(d => d.status === DelegationStatus.FAILED).length,
      cancelled: delegations.filter(d => d.status === DelegationStatus.CANCELLED).length,
    };
  }
}
