import { RooCodeEventName } from '../roo-code/types';

// API Request/Response types

export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

export interface ApiResponse<T = any> {
	data?: T;
	error?: ApiError;
}

// Health endpoint
export interface HealthResponse {
	status: 'ok' | 'error';
	rooCodeConnected: boolean;
	version: string;
	uptime: number;
}

// Status endpoint
export interface StatusResponse {
	isReady: boolean;
	currentTaskStack: string[];
	activeProfile?: string;
	configuration: any;
}

// Task endpoints
export interface StartTaskRequest {
	text: string;
	configuration?: {
		mode?: string;
		currentApiConfigName?: string;
		[key: string]: any;
	};
	images?: string[];
	newTab?: boolean;
}

export interface StartTaskResponse {
	taskId: string;
	status: 'started';
}

export interface SendMessageRequest {
	message: string;
	images?: string[];
}

export interface ResumeTaskRequest {
	taskId: string;
}

// Configuration endpoints
export interface UpdateConfigurationRequest {
	[key: string]: any;
}

// Profile endpoints
export interface SetActiveProfileRequest {
	name: string;
}

export interface ProfilesResponse {
	profiles: string[];
	active?: string;
}

// WebSocket message types
export interface WebSocketMessage {
	type: 'subscribe' | 'unsubscribe' | 'event' | 'subscribed' | 'unsubscribed' | 'error';
	events?: RooCodeEventName[];
	eventName?: RooCodeEventName;
	payload?: any;
	timestamp?: string;
	taskId?: string;
	error?: string;
}

export interface WebSocketClient {
	id: string;
	ws: any;
	subscribedEvents: Set<RooCodeEventName>;
}