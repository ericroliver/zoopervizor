import * as vscode from 'vscode';
import { Logger } from './logging/logger';
import { StatusBarManager } from './ui/status-bar';
import { RooCodeListener } from './roo-code/listener';
import { RooCodeController } from './roo-code/controller';
import { ApiServer } from './api/server';
import { ConfigurationManager, ZoopervizorConfig } from './config/settings';
import { RooCodeEventName } from './roo-code/types';

let logger: Logger;
let statusBar: StatusBarManager;
let listener: RooCodeListener;
let controller: RooCodeController;
let apiServer: ApiServer;
let config: ZoopervizorConfig;

export async function activate(context: vscode.ExtensionContext) {
	console.log('Zoopervizor is activating...');

	// Get configuration
	config = ConfigurationManager.getConfig();

	// Initialize logger
	logger = new Logger('Zoopervizor', config.logging.level);
	logger.info('Zoopervizor extension activating...');

	// Initialize status bar
	statusBar = new StatusBarManager();
	if (config.statusBar.enabled) {
		statusBar.show();
	}

	// Initialize Roo-Code integration
	controller = new RooCodeController(logger);
	listener = new RooCodeListener(logger, statusBar);

	// Try to connect to Roo-Code
	if (config.enabled) {
		const connected = await listener.connect();
		if (connected) {
			controller.setAPI(listener.getAPI());
			setupEventForwarding();
		} else {
			logger.warn('Failed to connect to Roo-Code. Will retry when Roo-Code becomes available.');
			vscode.window.showWarningMessage(
				'Zoopervizor: Roo-Code extension not found. Please install Roo-Code to enable monitoring.'
			);
		}
	}

	// Initialize API server
	if (config.api.enabled) {
		apiServer = new ApiServer(controller, listener, logger, config.api.port);
		try {
			await apiServer.start();
		} catch (error) {
			logger.error('Failed to start API server', error);
			vscode.window.showErrorMessage(
				`Zoopervizor: Failed to start API server on port ${config.api.port}. ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// Register commands
	registerCommands(context);

	// Watch for configuration changes
	context.subscriptions.push(
		ConfigurationManager.onConfigChange(handleConfigChange)
	);

	// Add disposables
	context.subscriptions.push(logger);
	context.subscriptions.push(statusBar);

	logger.info('Zoopervizor extension activated successfully');
	console.log('Zoopervizor is now active!');
}

function setupEventForwarding(): void {
	// Forward all Roo-Code events to WebSocket clients
	const allEvents: RooCodeEventName[] = [
		'taskCreated',
		'taskStarted',
		'taskCompleted',
		'taskAborted',
		'taskFocused',
		'taskUnfocused',
		'taskActive',
		'taskInteractive',
		'taskResumable',
		'taskIdle',
		'taskPaused',
		'taskUnpaused',
		'taskSpawned',
		'message',
		'taskModeSwitched',
		'taskAskResponded',
		'taskUserMessage',
		'taskTokenUsageUpdated',
		'taskToolFailed',
		'modeChanged',
		'providerProfileChanged',
	];

	allEvents.forEach(eventName => {
		listener.onEvent(eventName, (...args: any[]) => {
			if (apiServer && apiServer.isRunning()) {
				// Extract taskId if it's the first argument and is a string
				const taskId = typeof args[0] === 'string' ? args[0] : undefined;
				
				// Broadcast to WebSocket clients
				apiServer.getWebSocketHandler().broadcastEvent(eventName, args, taskId);
				
				// Forward to BytebotAdapter for delegation handling
				const bytebotAdapter = apiServer.getBytebotAdapter();
				if (bytebotAdapter && bytebotAdapter.isEnabled()) {
					// Construct event data based on event type
					let eventData: any;
					
					if (eventName === 'message' && args.length > 0) {
						// Message events have the full event object as first arg
						eventData = args[0];
					} else if (eventName === 'taskCompleted' && args.length > 0) {
						// Task completed has taskId as first arg, then additional data
						eventData = {
							taskId: args[0],
							tokenUsage: args[1],
							toolUsage: args[2],
							meta: args[3]
						};
					} else if (eventName === 'taskToolFailed' && args.length > 0) {
						// Tool failed has taskId, tool name, and error
						eventData = {
							taskId: args[0],
							tool: args[1],
							error: args[2]
						};
					} else {
						// For other events, taskId is typically the first argument
						eventData = typeof args[0] === 'string' ? args[0] : args[0];
					}
					
					bytebotAdapter.handleRooCodeEvent(eventName, eventData);
				}
			}
		});
	});

	logger.info('Event forwarding to WebSocket clients and BytebotAdapter enabled');
}

function registerCommands(context: vscode.ExtensionContext): void {
	// Show output command
	context.subscriptions.push(
		vscode.commands.registerCommand('zoopervizor.showOutput', () => {
			logger.show();
		})
	);

	// Toggle status bar command
	context.subscriptions.push(
		vscode.commands.registerCommand('zoopervizor.toggleStatusBar', () => {
			if (statusBar) {
				const currentConfig = ConfigurationManager.getConfig();
				const newValue = !currentConfig.statusBar.enabled;
				vscode.workspace.getConfiguration('zoopervizor').update(
					'statusBar.enabled',
					newValue,
					vscode.ConfigurationTarget.Global
				);
			}
		})
	);

	// Restart server command
	context.subscriptions.push(
		vscode.commands.registerCommand('zoopervizor.restartServer', async () => {
			if (apiServer) {
				logger.info('Restarting API server...');
				apiServer.stop();
				try {
					await apiServer.start();
					vscode.window.showInformationMessage('Zoopervizor: API server restarted successfully');
				} catch (error) {
					logger.error('Failed to restart API server', error);
					vscode.window.showErrorMessage(
						`Zoopervizor: Failed to restart API server. ${error instanceof Error ? error.message : 'Unknown error'}`
					);
				}
			}
		})
	);

	logger.info('Commands registered');
}

async function handleConfigChange(newConfig: ZoopervizorConfig): Promise<void> {
	logger.info('Configuration changed', newConfig);

	// Update logger level
	if (logger) {
		logger.setLogLevel(newConfig.logging.level);
	}

	// Update status bar visibility
	if (statusBar) {
		if (newConfig.statusBar.enabled) {
			statusBar.show();
		} else {
			statusBar.hide();
		}
	}

	// Handle API server port change
	if (apiServer && newConfig.api.port !== apiServer.getPort()) {
		logger.info(`API port changed to ${newConfig.api.port}, restarting server...`);
		apiServer.stop();
		if (newConfig.api.enabled) {
			apiServer.setPort(newConfig.api.port);
			try {
				await apiServer.start();
			} catch (error) {
				logger.error('Failed to restart API server with new port', error);
				vscode.window.showErrorMessage(
					`Zoopervizor: Failed to restart API server on port ${newConfig.api.port}`
				);
			}
		}
	}

	// Handle API server enable/disable
	if (newConfig.api.enabled && (!apiServer || !apiServer.isRunning())) {
		logger.info('Starting API server...');
		if (!apiServer) {
			apiServer = new ApiServer(controller, listener, logger, newConfig.api.port);
		}
		try {
			await apiServer.start();
		} catch (error) {
			logger.error('Failed to start API server', error);
		}
	} else if (!newConfig.api.enabled && apiServer && apiServer.isRunning()) {
		logger.info('Stopping API server...');
		apiServer.stop();
	}

	// Handle monitoring enable/disable
	if (newConfig.enabled && !listener.isConnected()) {
		logger.info('Attempting to connect to Roo-Code...');
		const connected = await listener.connect();
		if (connected) {
			controller.setAPI(listener.getAPI());
			setupEventForwarding();
		}
	} else if (!newConfig.enabled && listener.isConnected()) {
		logger.info('Disconnecting from Roo-Code...');
		listener.disconnect();
		controller.setAPI(null);
	}

	config = newConfig;
}

export function deactivate() {
	logger?.info('Zoopervizor extension deactivating...');

	// Stop API server
	if (apiServer) {
		apiServer.stop();
	}

	// Disconnect from Roo-Code
	if (listener) {
		listener.disconnect();
	}

	logger?.info('Zoopervizor extension deactivated');
	console.log('Zoopervizor has been deactivated');
}