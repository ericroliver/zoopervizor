import * as vscode from 'vscode';

export interface ZupervizorConfig {
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
	private static readonly CONFIG_SECTION = 'zupervizor';

	static getConfig(): ZupervizorConfig {
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

	static onConfigChange(callback: (config: ZupervizorConfig) => void): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration(this.CONFIG_SECTION)) {
				callback(this.getConfig());
			}
		});
	}
}