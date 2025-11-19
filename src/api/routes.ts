import { Request, Response, Router, NextFunction } from 'express';
import { RooCodeController } from '../roo-code/controller';
import { RooCodeListener } from '../roo-code/listener';
import { Logger } from '../logging/logger';
import {
  HealthResponse,
  StatusResponse,
  StartTaskRequest,
  StartTaskResponse,
  SendMessageRequest,
  ResumeTaskRequest,
  UpdateConfigurationRequest,
  SetActiveProfileRequest,
  ProfilesResponse,
  ApiError,
} from './types';

export class ApiRoutes {
  private router: Router;
  private controller: RooCodeController;
  private listener: RooCodeListener;
  private logger: Logger;
  private startTime: number;

  constructor(controller: RooCodeController, listener: RooCodeListener, logger: Logger) {
    this.router = Router();
    this.controller = controller;
    this.listener = listener;
    this.logger = logger;
    this.startTime = Date.now();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.router.get('/health', this.handleHealth.bind(this));

    // Status
    this.router.get('/status', this.handleStatus.bind(this));

    // Task control
    this.router.post('/tasks/start', this.asyncHandler(this.handleStartTask.bind(this)));
    this.router.post('/tasks/message', this.asyncHandler(this.handleSendMessage.bind(this)));
    this.router.post('/tasks/cancel', this.asyncHandler(this.handleCancelTask.bind(this)));
    this.router.post('/tasks/resume', this.asyncHandler(this.handleResumeTask.bind(this)));

    // Configuration
    this.router.get('/configuration', this.handleGetConfiguration.bind(this));
    this.router.put('/configuration', this.asyncHandler(this.handleUpdateConfiguration.bind(this)));

    // Profiles
    this.router.get('/profiles', this.handleGetProfiles.bind(this));
    this.router.post('/profiles/active', this.asyncHandler(this.handleSetActiveProfile.bind(this)));
  }

  // Wrapper for async route handlers to ensure proper error handling
  private asyncHandler(
    fn: (req: Request, res: Response) => Promise<void>,
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res)).catch(next);
    };
  }

  private handleHealth(req: Request, res: Response): void {
    const response: HealthResponse = {
      status: 'ok',
      rooCodeConnected: this.listener.isConnected(),
      version: '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };

    if (!this.listener.isConnected()) {
      res.status(503).json(response);
    } else {
      res.json(response);
    }
  }

  private handleStatus(req: Request, res: Response): void {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    try {
      const response: StatusResponse = {
        isReady: this.controller.isReady(),
        currentTaskStack: this.controller.getCurrentTaskStack(),
        activeProfile: this.controller.getActiveProfile(),
        configuration: this.controller.getConfiguration(),
      };
      res.json(response);
    } catch (error) {
      this.logger.error('Failed to get status', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get status');
    }
  }

  private async handleStartTask(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    const body = req.body as StartTaskRequest;

    if (!body.text) {
      return this.sendError(res, 400, 'INVALID_REQUEST', 'Missing required field: text');
    }

    try {
      const taskId = await this.controller.startNewTask({
        text: body.text,
        configuration: body.configuration,
        images: body.images,
        newTab: body.newTab,
      });

      const response: StartTaskResponse = {
        taskId,
        status: 'started',
      };
      res.json(response);
    } catch (error) {
      this.logger.error('Failed to start task', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to start task');
    }
  }

  private async handleSendMessage(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    const body = req.body as SendMessageRequest;

    if (!body.message) {
      return this.sendError(res, 400, 'INVALID_REQUEST', 'Missing required field: message');
    }

    try {
      await this.controller.sendMessage(body.message, body.images);
      res.json({ status: 'sent' });
    } catch (error) {
      this.logger.error('Failed to send message', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to send message');
    }
  }

  private async handleCancelTask(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    try {
      await this.controller.cancelCurrentTask();
      res.json({ status: 'cancelled' });
    } catch (error) {
      this.logger.error('Failed to cancel task', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to cancel task');
    }
  }

  private async handleResumeTask(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    const body = req.body as ResumeTaskRequest;

    if (!body.taskId) {
      return this.sendError(res, 400, 'INVALID_REQUEST', 'Missing required field: taskId');
    }

    try {
      await this.controller.resumeTask(body.taskId);
      res.json({ status: 'resumed' });
    } catch (error) {
      this.logger.error('Failed to resume task', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to resume task');
    }
  }

  private handleGetConfiguration(req: Request, res: Response): void {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    try {
      const configuration = this.controller.getConfiguration();
      res.json(configuration);
    } catch (error) {
      this.logger.error('Failed to get configuration', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get configuration');
    }
  }

  private async handleUpdateConfiguration(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    const body = req.body as UpdateConfigurationRequest;

    try {
      await this.controller.setConfiguration(body);
      res.json({ status: 'updated' });
    } catch (error) {
      this.logger.error('Failed to update configuration', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update configuration');
    }
  }

  private handleGetProfiles(req: Request, res: Response): void {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    try {
      const response: ProfilesResponse = {
        profiles: this.controller.getProfiles(),
        active: this.controller.getActiveProfile(),
      };
      res.json(response);
    } catch (error) {
      this.logger.error('Failed to get profiles', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get profiles');
    }
  }

  private async handleSetActiveProfile(req: Request, res: Response): Promise<void> {
    if (!this.listener.isConnected()) {
      return this.sendError(res, 503, 'ROO_CODE_NOT_CONNECTED', 'Roo-Code extension is not connected');
    }

    const body = req.body as SetActiveProfileRequest;

    if (!body.name) {
      return this.sendError(res, 400, 'INVALID_REQUEST', 'Missing required field: name');
    }

    try {
      const profile = await this.controller.setActiveProfile(body.name);
      res.json({ status: 'activated', profile });
    } catch (error) {
      this.logger.error('Failed to set active profile', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to set active profile');
    }
  }

  private sendError(res: Response, status: number, code: string, message: string, details?: unknown): void {
    const error: ApiError = {
      code,
      message,
      details,
    };
    res.status(status).json({ error });
  }

  getRouter(): Router {
    return this.router;
  }
}
