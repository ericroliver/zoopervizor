/**
 * Type definitions for Roo-Code API
 * These mirror the types from @roo-code/types package
 */

export type RooCodeEventName =
	| 'taskCreated'
	| 'taskStarted'
	| 'taskCompleted'
	| 'taskAborted'
	| 'taskFocused'
	| 'taskUnfocused'
	| 'taskActive'
	| 'taskInteractive'
	| 'taskResumable'
	| 'taskIdle'
	| 'taskPaused'
	| 'taskUnpaused'
	| 'taskSpawned'
	| 'message'
	| 'taskModeSwitched'
	| 'taskAskResponded'
	| 'taskUserMessage'
	| 'taskTokenUsageUpdated'
	| 'taskToolFailed'
	| 'modeChanged'
	| 'providerProfileChanged';

export interface TokenUsage {
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens?: number;
	cacheWriteTokens?: number;
}

export interface ToolUsage {
	[toolName: string]: number;
}

export interface ClineMessage {
	type: string;
	say?: string;
	text?: string;
	[key: string]: any;
}

export interface MessageEvent {
	taskId: string;
	action: 'created' | 'updated';
	message: ClineMessage;
}

export interface RooCodeSettings {
	mode?: string;
	currentApiConfigName?: string;
	[key: string]: any;
}

export interface TaskOptions {
	configuration?: RooCodeSettings;
	text?: string;
	images?: string[];
	newTab?: boolean;
}

export interface ProviderSettings {
	[key: string]: any;
}

export interface RooCodeAPI {
	// Event emitter methods
	on(event: RooCodeEventName, listener: (...args: any[]) => void): void;
	off(event: RooCodeEventName, listener: (...args: any[]) => void): void;

	// Task control
	startNewTask(options: TaskOptions): Promise<string>;
	resumeTask(taskId: string): Promise<void>;
	clearCurrentTask(lastMessage?: string): Promise<void>;
	cancelCurrentTask(): Promise<void>;
	sendMessage(message?: string, images?: string[]): Promise<void>;
	pressPrimaryButton(): Promise<void>;
	pressSecondaryButton(): Promise<void>;

	// Configuration
	getConfiguration(): RooCodeSettings;
	setConfiguration(values: RooCodeSettings): Promise<void>;

	// Profile management
	getProfiles(): string[];
	createProfile(name: string, profile?: ProviderSettings, activate?: boolean): Promise<string>;
	updateProfile(name: string, profile: ProviderSettings, activate?: boolean): Promise<string | undefined>;
	deleteProfile(name: string): Promise<void>;
	getActiveProfile(): string | undefined;
	setActiveProfile(name: string): Promise<string | undefined>;

	// State queries
	isReady(): boolean;
	getCurrentTaskStack(): string[];
	isTaskInHistory(taskId: string): Promise<boolean>;
}