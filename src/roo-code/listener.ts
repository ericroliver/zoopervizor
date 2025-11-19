import * as vscode from 'vscode';
import { RooCodeAPI, RooCodeEventName } from './types';
import { Logger } from '../logging/logger';
import { StatusBarManager } from '../ui/status-bar';

type EventCallback = (...args: unknown[]) => void;

export class RooCodeListener {
  private api: RooCodeAPI | null = null;
  private logger: Logger;
  private statusBar: StatusBarManager;
  private eventCallbacks: Map<RooCodeEventName, Set<EventCallback>> = new Map();

  constructor(logger: Logger, statusBar: StatusBarManager) {
    this.logger = logger;
    this.statusBar = statusBar;
  }

  async connect(): Promise<boolean> {
    try {
      const rooCodeExt = vscode.extensions.getExtension('rooveterinaryinc.roo-cline');

      if (!rooCodeExt) {
        this.logger.warn('Roo-Code extension not found');
        this.statusBar.setState('disconnected');
        return false;
      }

      this.logger.info('Activating Roo-Code extension...');
      this.api = await rooCodeExt.activate() as RooCodeAPI;

      if (!this.api) {
        this.logger.error('Failed to get Roo-Code API');
        this.statusBar.setState('error', 'API not available');
        return false;
      }

      this.setupEventListeners();
      this.statusBar.setState('idle');
      this.logger.info('Successfully connected to Roo-Code');

      return true;
    } catch (error) {
      this.logger.error('Failed to connect to Roo-Code', error);
      this.statusBar.setState('error', 'Connection failed');
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.api) return;

    // Task lifecycle events
    this.api.on('taskCreated', (taskId: unknown) => {
      this.logger.info(`Task created: ${String(taskId)}`);
      this.emitToCallbacks('taskCreated', taskId);
    });

    this.api.on('taskStarted', (taskId: unknown) => {
      this.logger.info(`Task started: ${String(taskId)}`);
      this.statusBar.setState('running', taskId as string);
      this.emitToCallbacks('taskStarted', taskId);
    });

    this.api.on('taskCompleted', (taskId: unknown, tokenUsage: unknown, toolUsage: unknown, meta: unknown) => {
      this.logger.info(`Task completed: ${String(taskId)}`, { tokenUsage, toolUsage, meta });
      const totalTokens = (tokenUsage as { totalTokens?: number })?.totalTokens ?? 0;
      this.statusBar.setState('completed', `${totalTokens} tokens`);
      this.emitToCallbacks('taskCompleted', taskId, tokenUsage, toolUsage, meta);
    });

    this.api.on('taskAborted', (taskId: unknown) => {
      this.logger.info(`Task aborted: ${String(taskId)}`);
      this.statusBar.setState('idle');
      this.emitToCallbacks('taskAborted', taskId);
    });

    this.api.on('taskFocused', (taskId: unknown) => {
      this.logger.debug(`Task focused: ${String(taskId)}`);
      this.emitToCallbacks('taskFocused', taskId);
    });

    this.api.on('taskUnfocused', (taskId: unknown) => {
      this.logger.debug(`Task unfocused: ${String(taskId)}`);
      this.emitToCallbacks('taskUnfocused', taskId);
    });

    this.api.on('taskActive', (taskId: unknown) => {
      this.logger.debug(`Task active: ${String(taskId)}`);
      this.emitToCallbacks('taskActive', taskId);
    });

    this.api.on('taskInteractive', (taskId: unknown) => {
      this.logger.debug(`Task interactive: ${String(taskId)}`);
      this.emitToCallbacks('taskInteractive', taskId);
    });

    this.api.on('taskResumable', (taskId: unknown) => {
      this.logger.debug(`Task resumable: ${String(taskId)}`);
      this.emitToCallbacks('taskResumable', taskId);
    });

    this.api.on('taskIdle', (taskId: unknown) => {
      this.logger.debug(`Task idle: ${String(taskId)}`);
      this.emitToCallbacks('taskIdle', taskId);
    });

    this.api.on('taskPaused', (taskId: unknown) => {
      this.logger.info(`Task paused: ${String(taskId)}`);
      this.emitToCallbacks('taskPaused', taskId);
    });

    this.api.on('taskUnpaused', (taskId: unknown) => {
      this.logger.info(`Task unpaused: ${String(taskId)}`);
      this.emitToCallbacks('taskUnpaused', taskId);
    });

    this.api.on('taskSpawned', (parentTaskId: unknown, childTaskId: unknown) => {
      this.logger.info(`Task spawned: ${String(parentTaskId)} -> ${String(childTaskId)}`);
      this.emitToCallbacks('taskSpawned', parentTaskId, childTaskId);
    });

    // Execution events
    this.api.on('message', (event: unknown) => {
      this.logger.info('Message event', event);
      this.emitToCallbacks('message', event);
    });

    this.api.on('taskModeSwitched', (taskId: unknown, mode: unknown) => {
      this.logger.info(`Task mode switched: ${String(taskId)} -> ${String(mode)}`);
      this.emitToCallbacks('taskModeSwitched', taskId, mode);
    });

    this.api.on('taskAskResponded', (taskId: unknown) => {
      this.logger.debug(`Task ask responded: ${String(taskId)}`);
      this.emitToCallbacks('taskAskResponded', taskId);
    });

    this.api.on('taskUserMessage', (taskId: unknown) => {
      this.logger.info(`Task user message: ${String(taskId)}`);
      this.emitToCallbacks('taskUserMessage', taskId);
    });

    // Analytics events
    this.api.on('taskTokenUsageUpdated', (taskId: unknown, tokenUsage: unknown) => {
      this.logger.info(`Token usage updated: ${String(taskId)}`, tokenUsage);
      this.emitToCallbacks('taskTokenUsageUpdated', taskId, tokenUsage);
    });

    this.api.on('taskToolFailed', (taskId: unknown, tool: unknown, error: unknown) => {
      this.logger.warn(`Tool failed: ${String(tool)} in task ${String(taskId)}`, { error });
      this.emitToCallbacks('taskToolFailed', taskId, tool, error);
    });

    // Configuration events
    this.api.on('modeChanged', (mode: unknown) => {
      this.logger.info(`Mode changed: ${String(mode)}`);
      this.emitToCallbacks('modeChanged', mode);
    });

    this.api.on('providerProfileChanged', (profile: unknown) => {
      this.logger.info('Provider profile changed', profile);
      this.emitToCallbacks('providerProfileChanged', profile);
    });

    this.logger.info('Event listeners registered');
  }

  onEvent(eventName: RooCodeEventName, callback: EventCallback): void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }
  this.eventCallbacks.get(eventName)!.add(callback);
  }

  offEvent(eventName: RooCodeEventName, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emitToCallbacks(eventName: RooCodeEventName, ...args: unknown[]): void {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          this.logger.error(`Error in event callback for ${eventName}`, error);
        }
      });
    }
  }

  getAPI(): RooCodeAPI | null {
    return this.api;
  }

  isConnected(): boolean {
    return this.api !== null;
  }

  disconnect(): void {
    this.api = null;
    this.eventCallbacks.clear();
    this.statusBar.setState('disconnected');
    this.logger.info('Disconnected from Roo-Code');
  }
}
