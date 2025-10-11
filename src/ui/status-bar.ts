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
		this.statusBarItem.command = 'zupervizor.showOutput';
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

		this.statusBarItem.text = `${icon} Zupervizor: ${message}${detailsStr}`;
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