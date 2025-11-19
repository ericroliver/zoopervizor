/**
 * Question handler for managing interactive Q&A during delegations
 */

import { PendingQuestion } from './types';
import { Logger } from '../logging/logger';

export class QuestionHandler {
  private logger: Logger;
  private pendingQuestions: Map<string, PendingQuestion>;

  constructor() {
    this.logger = new Logger('QuestionHandler');
    this.pendingQuestions = new Map();
  }

  /**
   * Register a pending question for a delegation
   */
  addQuestion(delegationId: string, question: string): void {
    const pendingQuestion: PendingQuestion = {
      delegation_id: delegationId,
      question,
      timestamp: Date.now(),
    };

    this.pendingQuestions.set(delegationId, pendingQuestion);
    this.logger.info(`Added pending question for delegation ${delegationId}`);
  }

  /**
   * Get pending question for a delegation
   */
  getQuestion(delegationId: string): PendingQuestion | undefined {
    return this.pendingQuestions.get(delegationId);
  }

  /**
   * Check if delegation has a pending question
   */
  hasQuestion(delegationId: string): boolean {
    return this.pendingQuestions.has(delegationId);
  }

  /**
   * Clear pending question after it's been answered
   */
  clearQuestion(delegationId: string): void {
    const removed = this.pendingQuestions.delete(delegationId);
    if (removed) {
      this.logger.info(`Cleared pending question for delegation ${delegationId}`);
    }
  }

  /**
   * Get all pending questions
   */
  getAllPendingQuestions(): PendingQuestion[] {
    return Array.from(this.pendingQuestions.values());
  }

  /**
   * Clean up old pending questions (that may have been abandoned)
   */
  cleanupOld(olderThanMs: number = 600000): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [delegationId, question] of this.pendingQuestions.entries()) {
      if (now - question.timestamp > olderThanMs) {
        this.pendingQuestions.delete(delegationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old pending questions`);
    }

    return cleanedCount;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    } {
    return {
      total: this.pendingQuestions.size,
    };
  }
}
