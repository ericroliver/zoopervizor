import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { RooCodeController } from '../roo-code/controller';
import { RooCodeListener } from '../roo-code/listener';
import { Logger } from '../logging/logger';
import { WebSocketHandler } from './websocket';
import { ApiRoutes } from './routes';

export class ApiServer {
	private app: Express;
	private server: Server | null = null;
	private wsHandler: WebSocketHandler;
	private routes: ApiRoutes;
	private logger: Logger;
	private port: number;

	constructor(
		controller: RooCodeController,
		listener: RooCodeListener,
		logger: Logger,
		port: number = 3737
	) {
		this.logger = logger;
		this.port = port;
		this.app = express();
		this.wsHandler = new WebSocketHandler(logger);
		this.routes = new ApiRoutes(controller, listener, logger);

		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware(): void {
		// Parse JSON bodies
		this.app.use(express.json());

		// CORS - disabled for localhost only
		this.app.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', 'http://localhost:*');
			res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			res.header('Access-Control-Allow-Headers', 'Content-Type');
			next();
		});

		// Request logging
		this.app.use((req, res, next) => {
			this.logger.debug(`${req.method} ${req.path}`);
			next();
		});
	}

	private setupRoutes(): void {
		// Mount API routes
		this.app.use('/', this.routes.getRouter());

		// 404 handler
		this.app.use((req, res) => {
			res.status(404).json({
				error: {
					code: 'NOT_FOUND',
					message: `Route not found: ${req.method} ${req.path}`,
				},
			});
		});

		// Error handler
		this.app.use((err: any, req: any, res: any, next: any) => {
			this.logger.error('API error', err);
			res.status(500).json({
				error: {
					code: 'INTERNAL_ERROR',
					message: 'Internal server error',
					details: err.message,
				},
			});
		});
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.server = createServer(this.app);

				// Initialize WebSocket server
				this.wsHandler.initialize(this.server);

				this.server.listen(this.port, 'localhost', () => {
					this.logger.info(`API server started on http://localhost:${this.port}`);
					this.logger.info(`WebSocket server available at ws://localhost:${this.port}/events`);
					resolve();
				});

				this.server.on('error', (error: any) => {
					if (error.code === 'EADDRINUSE') {
						this.logger.error(`Port ${this.port} is already in use`);
						reject(new Error(`Port ${this.port} is already in use`));
					} else {
						this.logger.error('Server error', error);
						reject(error);
					}
				});
			} catch (error) {
				this.logger.error('Failed to start API server', error);
				reject(error);
			}
		});
	}

	stop(): void {
		if (this.server) {
			this.wsHandler.close();
			this.server.close(() => {
				this.logger.info('API server stopped');
			});
			this.server = null;
		}
	}

	getWebSocketHandler(): WebSocketHandler {
		return this.wsHandler;
	}

	isRunning(): boolean {
		return this.server !== null;
	}

	getPort(): number {
		return this.port;
	}

	setPort(port: number): void {
		if (this.isRunning()) {
			throw new Error('Cannot change port while server is running');
		}
		this.port = port;
	}
}