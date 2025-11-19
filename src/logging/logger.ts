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

  private formatMessage(level: LogLevel, message: string, context?: unknown): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: unknown): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  info(message: string, context?: unknown): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  warn(message: string, context?: unknown): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, context);
      this.outputChannel.appendLine(formatted);
    }
  }

  error(message: string, error?: unknown): void {
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
