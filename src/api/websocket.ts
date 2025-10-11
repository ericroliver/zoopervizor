import { WebSocket, WebSocketServer } from 'ws';
import { RooCodeEventName } from '../roo-code/types';
import { Logger } from '../logging/logger';
import { WebSocketMessage, WebSocketClient } from './types';

export class WebSocketHandler {
	private wss: WebSocketServer | null = null;
	private clients: Map<string, WebSocketClient> = new Map();
	private logger: Logger;
	private clientIdCounter = 0;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	initialize(server: any): void {
		this.wss = new WebSocketServer({ server, path: '/events' });

		this.wss.on('connection', (ws: WebSocket) => {
			const clientId = `client-${++this.clientIdCounter}`;
			const client: WebSocketClient = {
				id: clientId,
				ws,
				subscribedEvents: new Set(),
			};

			this.clients.set(clientId, client);
			this.logger.info(`WebSocket client connected: ${clientId}`);

			ws.on('message', (data: Buffer) => {
				try {
					const message: WebSocketMessage = JSON.parse(data.toString());
					this.handleClientMessage(clientId, message);
				} catch (error) {
					this.logger.error(`Failed to parse WebSocket message from ${clientId}`, error);
					this.sendError(ws, 'Invalid message format');
				}
			});

			ws.on('close', () => {
				this.clients.delete(clientId);
				this.logger.info(`WebSocket client disconnected: ${clientId}`);
			});

			ws.on('error', (error) => {
				this.logger.error(`WebSocket error for client ${clientId}`, error);
			});
		});

		this.logger.info('WebSocket server initialized on /events');
	}

	private handleClientMessage(clientId: string, message: WebSocketMessage): void {
		const client = this.clients.get(clientId);
		if (!client) return;

		switch (message.type) {
			case 'subscribe':
				if (message.events && Array.isArray(message.events)) {
					message.events.forEach(event => client.subscribedEvents.add(event));
					this.logger.info(`Client ${clientId} subscribed to events`, message.events);
					this.sendToClient(client.ws, {
						type: 'subscribed',
						events: message.events,
					});
				}
				break;

			case 'unsubscribe':
				if (message.events && Array.isArray(message.events)) {
					message.events.forEach(event => client.subscribedEvents.delete(event));
					this.logger.info(`Client ${clientId} unsubscribed from events`, message.events);
					this.sendToClient(client.ws, {
						type: 'unsubscribed',
						events: message.events,
					});
				}
				break;

			default:
				this.sendError(client.ws, `Unknown message type: ${message.type}`);
		}
	}

	broadcastEvent(eventName: RooCodeEventName, payload: any[], taskId?: string): void {
		const message: WebSocketMessage = {
			type: 'event',
			eventName,
			payload,
			timestamp: new Date().toISOString(),
			taskId,
		};

		let sentCount = 0;
		this.clients.forEach(client => {
			// If client has no subscriptions, send all events
			// Otherwise, only send if subscribed to this event
			if (client.subscribedEvents.size === 0 || client.subscribedEvents.has(eventName)) {
				this.sendToClient(client.ws, message);
				sentCount++;
			}
		});

		if (sentCount > 0) {
			this.logger.debug(`Broadcast event ${eventName} to ${sentCount} clients`);
		}
	}

	private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
		if (ws.readyState === WebSocket.OPEN) {
			try {
				ws.send(JSON.stringify(message));
			} catch (error) {
				this.logger.error('Failed to send message to WebSocket client', error);
			}
		}
	}

	private sendError(ws: WebSocket, error: string): void {
		this.sendToClient(ws, {
			type: 'error',
			error,
		});
	}

	getConnectedClientsCount(): number {
		return this.clients.size;
	}

	close(): void {
		if (this.wss) {
			this.clients.forEach(client => {
				client.ws.close();
			});
			this.clients.clear();
			this.wss.close();
			this.logger.info('WebSocket server closed');
		}
	}
}