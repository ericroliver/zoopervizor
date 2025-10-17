# Zoopervizor - Implementation Guide

## Overview

This guide provides detailed implementation instructions for each component of the Zoopervizor extension. Follow these steps in order to build the MVP.

## Prerequisites

- Node.js 18+ installed
- VSCode installed
- Basic understanding of TypeScript and VSCode extension development
- Roo-Code extension installed (for testing)

## Step-by-Step Implementation

### Step 1: Project Initialization

#### 1.1 Initialize npm project

```bash
npm init -y
```

#### 1.2 Install dependencies

```bash
# Production dependencies
npm install express ws

# Development dependencies
npm install --save-dev \
  typescript \
  @types/node \
  @types/vscode \
  @types/express \
  @types/ws \
  @vscode/vsce \
  esbuild
```

#### 1.3 Create directory structure

```bash
mkdir -p src/{roo-code,logging,ui,api,config,utils}
mkdir -p docs
```

### Step 2: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out"]
}
```

### Step 3: Package.json Configuration

Update `package.json` with extension metadata:

```json
{
  "name": "zoopervizor",
  "displayName": "Zoopervizor",
  "description": "Monitor and control Roo-Code activities with external API bridge",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "zoopervizor.showOutput",
        "title": "Zoopervizor: Show Output"
      },
      {
        "command": "zoopervizor.toggleStatusBar",
        "title": "Zoopervizor: Toggle Status Bar"
      },
      {
        "command": "zoopervizor.restartServer",
        "title": "Zoopervizor: Restart API Server"
      }
    ],
    "configuration": {
      "title": "Zoopervizor",
      "properties": {
        "zoopervizor.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Zoopervizor monitoring"
        },
        "zoopervizor.api.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable API server for external agents"
        },
        "zoopervizor.api.port": {
          "type": "number",
          "default": 3737,
          "description": "Port for API server"
        },
        "zoopervizor.logging.level": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info",
          "description": "Logging level"
        },
        "zoopervizor.logging.showInOutput": {
          "type": "boolean",
          "default": true,
          "description": "Show logs in Output channel"
        },
        "zoopervizor.statusBar.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Show status bar item"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package",
    "lint": "eslint src --ext ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/node": "^20.8.0",
    "@types/vscode": "^1.85.0",
    "@types/ws": "^8.5.8",
    "@vscode/vsce": "^2.22.0",
    "typescript": "^5.2.2"
  }
}
```

### Step 4: Type Definitions

Create `src/roo-code/types.ts`:

```typescript
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
  createProfile(name: string, profile?: any, activate?: boolean): Promise<string>;
  updateProfile(name: string, profile: any, activate?: boolean): Promise<string | undefined>;
  deleteProfile(name: string): Promise<void>;
  getActiveProfile(): string | undefined;
  setActiveProfile(name: string): Promise<string | undefined>;
  
  // State queries
  isReady(): boolean;
  getCurrentTaskStack(): string[];
  isTaskInHistory(taskId: string): Promise<boolean>;
}
```

### Step 5: Configuration Management

Create `src/config/settings.ts`:

```typescript
import * as vscode from 'vscode';

export interface ZoopervizorConfig {
  enabled: boolean;
  api: {
    enabled: boolean;
    port: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    showInOutput: boolean;
  };
  statusBar: {
    enabled: boolean;
  };
}

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'zoopervizor';

  static getConfig(): ZoopervizorConfig {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    
    return {
      enabled: config.get('enabled', true),
      api: {
        enabled: config.get('api.enabled', true),
        port: config.get('api.port', 3737),
      },
      logging: {
        level: config.get('logging.level', 'info'),
        showInOutput: config.get('logging.showInOutput', true),
      },
      statusBar: {
        enabled: config.get('statusBar.enabled', true),
      },
    };
  }

  static onConfigChange(callback: (config: ZoopervizorConfig) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(this.CONFIG_SECTION)) {
        callback(this.getConfig());
      }
    });
  }
}
```

### Step 6: Logging System

Create `src/logging/logger.ts`:

```typescript
import * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel;

  constructor(channelName: string, logLevel: LogLevel = 'info') {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      const formatted = this.formatMessage('error', message, errorDetails);
      this.outputChannel.appendLine(formatted);
    }
  }

  show(): void {
    this.outputChannel.show();
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
```

### Step 7: Status Bar Manager

Create `src/ui/status-bar.ts`:

```typescript
import * as vscode from 'vscode';

export type StatusBarState = 'idle' | 'running' | 'completed' | 'error' | 'disconnected';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private currentState: StatusBarState = 'disconnected';

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'zoopervizor.showOutput';
    this.updateDisplay();
  }

  setState(state: StatusBarState, details?: string): void {
    this.currentState = state;
    this.updateDisplay(details);
  }

  private updateDisplay(details?: string): void {
    const icons = {
      idle: '$(check)',
      running: '$(sync~spin)',
      completed: '$(check)',
      error: '$(x)',
      disconnected: '$(warning)',
    };

    const messages = {
      idle: 'Ready',
      running: 'Task Running',
      completed: 'Task Completed',
      error: 'Error',
      disconnected: 'Roo-Code Not Found',
    };

    const icon = icons[this.currentState];
    const message = messages[this.currentState];
    const detailsStr = details ? ` - ${details}` : '';

    this.statusBarItem.text = `${icon} Zoopervizor: ${message}${detailsStr}`;
    this.statusBarItem.show();
  }

  show(): void {
    this.statusBarItem.show();
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
```

### Step 8: Roo-Code Listener

Create `src/roo-code/listener.ts`:

```typescript
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

    // Execution events
    this.api.on('message', (event: any) => {
      this.logger.debug(`Message event`, event);
      this.emitToCallbacks('message', event);
    });

    this.api.on('taskModeSwitched', (taskId: string, mode: string) => {
      this.logger.info(`Task mode switched: ${taskId} -> ${mode}`);
      this.emitToCallbacks('taskModeSwitched', taskId, mode);
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

    this.logger.info('Event listeners registered');
  }

  onEvent(eventName: RooCodeEventName, callback: Function): void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }
    this.eventCallbacks.get(eventName)!.add(callback);
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
```

### Step 9: Roo-Code Controller

Create `src/roo-code/controller.ts`:

```typescript
import { RooCodeAPI, TaskOptions, RooCodeSettings } from './types';
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

  isReady(): boolean {
    return this.api?.isReady() ?? false;
  }

  getCurrentTaskStack(): string[] {
    if (!this.api) {
      return [];
    }

    return this.api.getCurrentTaskStack();
  }
}
```

This implementation guide provides the foundation for the Zoopervizor extension. The next steps would be to implement the API server and WebSocket handler, followed by the main extension entry point.

## Next Steps

1. Implement API server (`src/api/server.ts`)
2. Implement WebSocket handler (`src/api/websocket.ts`)
3. Implement route handlers (`src/api/routes.ts`)
4. Create main extension entry point (`src/extension.ts`)
5. Add error handling utilities
6. Create README and API documentation
7. Test the extension