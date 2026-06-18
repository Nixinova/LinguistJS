import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

function copyIfExists(from, to) {
	if (existsSync(from)) cpSync(from, to, { recursive: true });
}

function installSmokeTest() {
	console.info('-'.repeat(8) + ' Install smoke test ' + '-'.repeat(8));
	const repoRoot = Path.resolve(Path.dirname(fileURLToPath(import.meta.url)), '..');
	const appDir = mkdtempSync(Path.join(tmpdir(), 'linguist-js-install-'));
	try {
		const appNodeModules = Path.join(appDir, 'node_modules');
		const packageDir = Path.join(appNodeModules, 'linguist-js');
		mkdirSync(packageDir, { recursive: true });
		cpSync(Path.join(repoRoot, 'node_modules'), appNodeModules, { recursive: true });

		copyIfExists(Path.join(repoRoot, 'dist'), Path.join(packageDir, 'dist'));
		copyIfExists(Path.join(repoRoot, 'bin'), Path.join(packageDir, 'bin'));
		copyIfExists(Path.join(repoRoot, 'ext'), Path.join(packageDir, 'ext'));

		const pkg = JSON.parse(readFileSync(Path.join(repoRoot, 'package.json'), 'utf-8'));
		delete pkg.scripts;
		delete pkg.devDependencies;
		writeFileSync(Path.join(packageDir, 'package.json'), JSON.stringify(pkg, null, '\t'));

		if (existsSync(Path.join(packageDir, 'node_modules', 'binary-extensions'))) {
			throw new Error('Smoke test setup should use a hoisted binary-extensions dependency');
		}

		const output = execFileSync(
			process.execPath,
			[
				'-e',
				"import('linguist-js').then(() => console.log('IMPORT_OK')).catch((error) => { console.error(error); process.exit(1); })",
			],
			{ cwd: appDir, encoding: 'utf-8' }
		);
		if (!output.includes('IMPORT_OK')) throw new Error(`Unexpected import output: ${output}`);
		console.info('Published package shape imports successfully');
	} finally {
		rmSync(appDir, { recursive: true, force: true });
	}
}

installSmokeTest();
