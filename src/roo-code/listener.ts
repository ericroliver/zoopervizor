import * as vscode from 'vscode';
import { RooCodeAPI, RooCodeEventName } from './types';
import { Logger } from '../logging/logger';
import { StatusBarManager } from '../ui/status-bar';

export class RooCodeListener {
	private api: RooCodeAPI | null = null;
	private logger: Logger;
	private statusBar: StatusBarManager;
	private eventCallbacks: Map<RooCodeEventName, Set<Function>> = new Map();

	constructor(logger: Logger, statusBar: StatusBarManager) {
		this.logger = logger;
		this.statusBar = statusBar;
	}

	async connect(): Promise<boolean> {
		try {
			const rooCodeExt = vscode.extensions.getExtension('rooveterinaryinc.roo-code');

			if (!rooCodeExt) {
				this.logger.warn('Roo-Code extension not found');
				this.statusBar.setState('disconnected');
				return false;
			}

			this.logger.info('Activating Roo-Code extension...');
			this.api = await rooCodeExt.activate();

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
		this.api.on('taskCreated', (taskId: string) => {
			this.logger.info(`Task created: ${taskId}`);
			this.emitToCallbacks('taskCreated', taskId);
		});

		this.api.on('taskStarted', (taskId: string) => {
			this.logger.info(`Task started: ${taskId}`);
			this.statusBar.setState('running', taskId);
			this.emitToCallbacks('taskStarted', taskId);
		});

		this.api.on('taskCompleted', (taskId: string, tokenUsage: any, toolUsage: any, meta: any) => {
			this.logger.info(`Task completed: ${taskId}`, { tokenUsage, toolUsage, meta });
			this.statusBar.setState('completed', `${tokenUsage.totalTokens} tokens`);
			this.emitToCallbacks('taskCompleted', taskId, tokenUsage, toolUsage, meta);
		});

		this.api.on('taskAborted', (taskId: string) => {
			this.logger.info(`Task aborted: ${taskId}`);
			this.statusBar.setState('idle');
			this.emitToCallbacks('taskAborted', taskId);
		});

		this.api.on('taskFocused', (taskId: string) => {
			this.logger.debug(`Task focused: ${taskId}`);
			this.emitToCallbacks('taskFocused', taskId);
		});

		this.api.on('taskUnfocused', (taskId: string) => {
			this.logger.debug(`Task unfocused: ${taskId}`);
			this.emitToCallbacks('taskUnfocused', taskId);
		});

		this.api.on('taskActive', (taskId: string) => {
			this.logger.debug(`Task active: ${taskId}`);
			this.emitToCallbacks('taskActive', taskId);
		});

		this.api.on('taskInteractive', (taskId: string) => {
			this.logger.debug(`Task interactive: ${taskId}`);
			this.emitToCallbacks('taskInteractive', taskId);
		});

		this.api.on('taskResumable', (taskId: string) => {
			this.logger.debug(`Task resumable: ${taskId}`);
			this.emitToCallbacks('taskResumable', taskId);
		});

		this.api.on('taskIdle', (taskId: string) => {
			this.logger.debug(`Task idle: ${taskId}`);
			this.emitToCallbacks('taskIdle', taskId);
		});

		this.api.on('taskPaused', (taskId: string) => {
			this.logger.info(`Task paused: ${taskId}`);
			this.emitToCallbacks('taskPaused', taskId);
		});

		this.api.on('taskUnpaused', (taskId: string) => {
			this.logger.info(`Task unpaused: ${taskId}`);
			this.emitToCallbacks('taskUnpaused', taskId);
		});

		this.api.on('taskSpawned', (parentTaskId: string, childTaskId: string) => {
			this.logger.info(`Task spawned: ${parentTaskId} -> ${childTaskId}`);
			this.emitToCallbacks('taskSpawned', parentTaskId, childTaskId);
		});

		// Execution events
		this.api.on('message', (event: any) => {
			this.logger.debug(`Message event`, event);
			this.emitToCallbacks('message', event);
		});

		this.api.on('taskModeSwitched', (taskId: string, mode: string) => {
			this.logger.info(`Task mode switched: ${taskId} -> ${mode}`);
			this.emitToCallbacks('taskModeSwitched', taskId, mode);
		});

		this.api.on('taskAskResponded', (taskId: string) => {
			this.logger.debug(`Task ask responded: ${taskId}`);
			this.emitToCallbacks('taskAskResponded', taskId);
		});

		this.api.on('taskUserMessage', (taskId: string) => {
			this.logger.debug(`Task user message: ${taskId}`);
			this.emitToCallbacks('taskUserMessage', taskId);
		});

		// Analytics events
		this.api.on('taskTokenUsageUpdated', (taskId: string, tokenUsage: any) => {
			this.logger.debug(`Token usage updated: ${taskId}`, tokenUsage);
			this.emitToCallbacks('taskTokenUsageUpdated', taskId, tokenUsage);
		});

		this.api.on('taskToolFailed', (taskId: string, tool: string, error: string) => {
			this.logger.warn(`Tool failed: ${tool} in task ${taskId}`, { error });
			this.emitToCallbacks('taskToolFailed', taskId, tool, error);
		});

		// Configuration events
		this.api.on('modeChanged', (mode: string) => {
			this.logger.info(`Mode changed: ${mode}`);
			this.emitToCallbacks('modeChanged', mode);
		});

		this.api.on('providerProfileChanged', (profile: any) => {
			this.logger.info(`Provider profile changed`, profile);
			this.emitToCallbacks('providerProfileChanged', profile);
		});

		this.logger.info('Event listeners registered');
	}

	onEvent(eventName: RooCodeEventName, callback: Function): void {
		if (!this.eventCallbacks.has(eventName)) {
			this.eventCallbacks.set(eventName, new Set());
		}
		this.eventCallbacks.get(eventName)!.add(callback);
	}

	offEvent(eventName: RooCodeEventName, callback: Function): void {
		const callbacks = this.eventCallbacks.get(eventName);
		if (callbacks) {
			callbacks.delete(callback);
		}
	}

	private emitToCallbacks(eventName: RooCodeEventName, ...args: any[]): void {
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