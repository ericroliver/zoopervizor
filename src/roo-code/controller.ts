import { RooCodeAPI, TaskOptions, RooCodeSettings, ProviderSettings } from './types';
import { Logger } from '../logging/logger';

export class RooCodeController {
  private api: RooCodeAPI | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  setAPI(api: RooCodeAPI | null): void {
    this.api = api;
  }

  async startNewTask(options: TaskOptions): Promise<string> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Starting new task', options);
      const taskId = await this.api.startNewTask(options);
      this.logger.info(`Task started with ID: ${taskId}`);
      return taskId;
    } catch (error) {
      this.logger.error('Failed to start task', error);
      throw error;
    }
  }

  async sendMessage(message: string, images?: string[]): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Sending message to task', { message, images });
      await this.api.sendMessage(message, images);
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }

  async cancelCurrentTask(): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Cancelling current task');
      await this.api.cancelCurrentTask();
    } catch (error) {
      this.logger.error('Failed to cancel task', error);
      throw error;
    }
  }

  async resumeTask(taskId: string): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info(`Resuming task: ${taskId}`);
      await this.api.resumeTask(taskId);
    } catch (error) {
      this.logger.error('Failed to resume task', error);
      throw error;
    }
  }

  async clearCurrentTask(lastMessage?: string): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Clearing current task', { lastMessage });
      await this.api.clearCurrentTask(lastMessage);
    } catch (error) {
      this.logger.error('Failed to clear task', error);
      throw error;
    }
  }

  async pressPrimaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Pressing primary button');
      await this.api.pressPrimaryButton();
    } catch (error) {
      this.logger.error('Failed to press primary button', error);
      throw error;
    }
  }

  async pressSecondaryButton(): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Pressing secondary button');
      await this.api.pressSecondaryButton();
    } catch (error) {
      this.logger.error('Failed to press secondary button', error);
      throw error;
    }
  }

  getConfiguration(): RooCodeSettings {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    return this.api.getConfiguration();
  }

  async setConfiguration(values: RooCodeSettings): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info('Setting configuration', values);
      await this.api.setConfiguration(values);
    } catch (error) {
      this.logger.error('Failed to set configuration', error);
      throw error;
    }
  }

  getProfiles(): string[] {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    return this.api.getProfiles();
  }

  getActiveProfile(): string | undefined {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    return this.api.getActiveProfile();
  }

  async setActiveProfile(name: string): Promise<string | undefined> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info(`Setting active profile: ${name}`);
      return await this.api.setActiveProfile(name);
    } catch (error) {
      this.logger.error('Failed to set active profile', error);
      throw error;
    }
  }

  async createProfile(name: string, profile?: ProviderSettings, activate?: boolean): Promise<string> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info(`Creating profile: ${name}`, { activate });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.api.createProfile(name, profile, activate);
    } catch (error) {
      this.logger.error('Failed to create profile', error);
      throw error;
    }
  }

  async updateProfile(name: string, profile: ProviderSettings, activate?: boolean): Promise<string | undefined> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info(`Updating profile: ${name}`, { activate });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return await this.api.updateProfile(name, profile, activate);
    } catch (error) {
      this.logger.error('Failed to update profile', error);
      throw error;
    }
  }

  async deleteProfile(name: string): Promise<void> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      this.logger.info(`Deleting profile: ${name}`);
      await this.api.deleteProfile(name);
    } catch (error) {
      this.logger.error('Failed to delete profile', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.api?.isReady() ?? false;
  }

  getCurrentTaskStack(): string[] {
    if (!this.api) {
      return [];
    }

    return this.api.getCurrentTaskStack();
  }

  async isTaskInHistory(taskId: string): Promise<boolean> {
    if (!this.api) {
      throw new Error('Roo-Code API not connected');
    }

    try {
      return await this.api.isTaskInHistory(taskId);
    } catch (error) {
      this.logger.error('Failed to check task history', error);
      throw error;
    }
  }
}
