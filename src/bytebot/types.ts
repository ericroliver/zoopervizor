/**
 * Bytebot integration types for Zupervizor
 */

import { RooCodeEventName, ClineMessage, TokenUsage } from '../roo-code/types';

/**
 * Delegation status
 */
export enum DelegationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Delegation request from Bytebot
 */
export interface DelegationRequest {
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

/**
 * Delegation response to Bytebot
 */
export interface DelegationResponse {
  delegation_id: string;
  roo_task_id: string;
  status: DelegationStatus;
  message: string;
}

/**
 * Delegation result
 */
export interface DelegationResult {
  delegation_id: string;
  status: DelegationStatus;
  result?: string;
  error?: string;
  files_modified?: string[];
  duration?: number;
}

/**
 * Delegation event emitted to Bytebot
 */
export interface DelegationEvent {
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

/**
 * Internal state of a delegation
 */
export interface DelegationState {
  delegation_id: string;
  bytebot_task_id: string;
  roo_task_id?: string;
  status: DelegationStatus;
  interaction_mode: 'blocking' | 'autonomous' | 'interactive';
  created_at: number;
  updated_at: number;
  completed_at?: number;
  error?: string;
  result?: DelegationResult;
  timeout?: NodeJS.Timeout;
}

/**
 * Pending question during delegation
 */
export interface PendingQuestion {
  delegation_id: string;
  question: string;
  timestamp: number;
}

/**
 * Event normalizer context
 */
export interface EventNormalizerContext {
  delegation: DelegationState;
  rooEvent: {
    name: RooCodeEventName;
    data: any;
  };
}