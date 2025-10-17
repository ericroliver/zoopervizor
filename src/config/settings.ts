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
	bytebot: {
		enabled: boolean;
		maxConcurrentDelegations: number;
		delegationTimeout: number;
		autoCleanupCompletedAfter: number;
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
			bytebot: {
				enabled: config.get('bytebot.enabled', true),
				maxConcurrentDelegations: config.get('bytebot.maxConcurrentDelegations', 3),
				delegationTimeout: config.get('bytebot.delegationTimeout', 300000),
				autoCleanupCompletedAfter: config.get('bytebot.autoCleanupCompletedAfter', 3600000),
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