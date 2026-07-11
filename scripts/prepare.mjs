import { spawnSync } from 'child_process';
import os from 'os';
import fs from 'fs';

/**
 * Improved Husky Preparation Script
 * - Supports Husky v9+ (removes deprecated 'install' command)
 * - Robust cross-platform execution (Windows/Linux/macOS)
 * - Automatic permission handling for POSIX systems
 */

const isWindows = os.platform() === 'win32';

// Helper to run commands with consistent logging and error handling
const runCommand = (cmd, args) => {
	console.log(`> Executing: ${cmd} ${args.join(' ')}`);

	const result = spawnSync(cmd, args, {
		stdio: 'inherit',
		shell: isWindows, // Use shell on Windows for path resolution
	});

	if (result.error) {
		console.error(`Error executing ${cmd}:`, result.error.message);
		return 1;
	}

	return result.status;
};

const prepareHusky = () => {
	console.log('--- Preparing Development Environment ---');

	// Skip Husky in CI environments (Vercel, GitHub Actions, etc.)
	if (process.env.CI === 'true' || process.env.VERCEL === '1') {
		console.log('CI environment detected. Skipping Husky initialization.');
		process.exit(0);
	}

	// 1. Initialize Husky (using modern v9+ command)
	const status = runCommand('npx', ['husky']);

	if (status !== 0) {
		console.error('❌ Husky initialization failed.');
		process.exit(1);
	}

	// 2. Fix permissions for macOS/Linux (CRUCIAL for pre-commit hooks)
	if (!isWindows) {
		if (fs.existsSync('.husky')) {
			console.log(
				'Detected POSIX system. Ensuring hook executability...',
			);
			const chmodStatus = runCommand('chmod', ['-R', 'ug+x', '.husky']);

			if (chmodStatus !== 0) {
				console.warn(
					'⚠️ Warning: Failed to set hook permissions. Hooks may not run.',
				);
			}
		}
	}

	console.log('✅ Husky environment ready!');
	process.exit(0);
};

// Execute if called directly
prepareHusky();
