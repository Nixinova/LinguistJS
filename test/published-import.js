import { execSync } from 'node:child_process';
import FS from 'node:fs';
import OS from 'node:os';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = Path.dirname(Path.dirname(fileURLToPath(import.meta.url)));
const tmp = FS.mkdtempSync(Path.join(OS.tmpdir(), 'linguist-smoke-'));
let tgzPath = '';

console.info('-'.repeat(8) + ' Published import smoke ' + '-'.repeat(8));

try {
	const packOut = execSync('npm pack --silent', { cwd: root, encoding: 'utf8' }).trim();
	tgzPath = Path.isAbsolute(packOut) ? packOut : Path.join(root, packOut);

	execSync('npm init -y', { cwd: tmp, stdio: 'pipe' });
	execSync(`npm install "${tgzPath}" --silent`, { cwd: tmp, stdio: 'pipe' });
	execSync(
		`node --input-type=module -e "import linguist from 'linguist-js'; await linguist.analyseRawContent({ 'sample.js': 'console.log(1)' }); console.log('IMPORT_OK');"`,
		{ cwd: tmp, stdio: 'inherit' }
	);
} finally {
	FS.rmSync(tmp, { recursive: true, force: true });
	if (tgzPath && FS.existsSync(tgzPath)) {
		FS.unlinkSync(tgzPath);
	}
}
