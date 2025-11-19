import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { RooCodeEventName } from '../roo-code/types';
import { Logger } from '../logging/logger';
import { WebSocketMessage, WebSocketClient } from './types';
import { RooCodeController } from '../roo-code/controller';
import { DelegationRequest, DelegationEvent } from '../bytebot';
import { BytebotAdapter } from '../bytebot/bytebot-adapter';

export class WebSocketHandler {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private logger: Logger;
  private controller: RooCodeController;
  private bytebotAdapter: BytebotAdapter | null = null;
  private clientIdCounter = 0;

  constructor(logger: Logger, controller: RooCodeController) {
    this.logger = logger;
    this.controller = controller;
  }

  /**
	 * Set the BytebotAdapter for handling delegations
	 */
  setBytebotAdapter(adapter: BytebotAdapter): void {
    this.bytebotAdapter = adapter;
  }

  initialize(server: Server): void {
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
          const message = JSON.parse(data.toString()) as WebSocketMessage;
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
      case 'delegate_task':
        this.logger.info(`Client ${clientId} delegating a task`);
        this.handleDelegateTask(clientId, message).catch(error => {
          this.logger.error(`Error handling delegate_task for ${clientId}`, error);
        });
        break;
      default:
        this.sendError(client.ws, `Unknown message type: ${message.type}`);
    }
  }

  broadcastEvent(eventName: RooCodeEventName, payload: unknown[], taskId?: string): void {
    // TEMP: Only broadcast delegate-related events
    if (!eventName.includes('delegate')) {
      return;
    }

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

  /**
	 * Broadcast delegation event to all connected clients
	 */
  broadcastDelegationEvent(event: DelegationEvent): void {
    const message: WebSocketMessage = {
      type: 'event',
      eventName: 'delegation_event' as RooCodeEventName,
      payload: [event],
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    this.clients.forEach(client => {
      // Send delegation events to all clients (or filter by subscription if needed)
      if (client.subscribedEvents.size === 0 || client.subscribedEvents.has('delegation_event' as RooCodeEventName)) {
        this.sendToClient(client.ws, message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      this.logger.debug(`Broadcast delegation event ${event.type} to ${sentCount} clients`);
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

  private async handleDelegateTask(clientId: string, message: WebSocketMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!message.delegation_id) {
      this.sendError(client.ws, 'Missing delegation request data');
      return;
    }

    const delegation = <DelegationRequest><unknown>message;
    this.logger.info(`Received delegation request: ${delegation.delegation_id}`, delegation);

    // Check if BytebotAdapter is available
    if (!this.bytebotAdapter) {
      this.logger.error('BytebotAdapter not available for delegation');
      this.sendToClient(client.ws, {
        type: 'delegation_response',
        delegation_id: delegation.delegation_id,
        status: 'failed',
        message: 'Bytebot integration not available',
        error: 'BytebotAdapter not initialized',
      });
      return;
    }

    try {
      // Delegate through BytebotAdapter to properly link tasks
      const response = await this.bytebotAdapter.delegateTask(delegation);

      this.logger.info(`Delegation ${delegation.delegation_id} handled successfully`);

      // Send success response
      this.sendToClient(client.ws, {
        type: 'delegation_response',
        delegation_id: response.delegation_id,
        roo_task_id: response.roo_task_id,
        status: response.status,
        message: response.message,
      });

    } catch (error: unknown) {
      this.logger.error(`Failed to handle delegated task: ${delegation.delegation_id}`, error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to start task';

      // Send error response
      this.sendToClient(client.ws, {
        type: 'delegation_response',
        delegation_id: delegation.delegation_id,
        status: 'failed',
        message: errorMessage,
        error: errorMessage,
      });
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
