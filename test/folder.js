import { updatedDiff } from 'deep-object-diff';
import FS from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import linguist from '../dist/index.js';

async function testFolder() {
	console.info('-'.repeat(11) + ' Folder test ' + '-'.repeat(11));
	const curFolder = dirname(fileURLToPath(import.meta.url));
	const samplesFolder = curFolder.replace(/\\/g, '/') + '/samples';
	const expectedJson = FS.readFileSync(curFolder + '/expected.json', { encoding: 'utf8' });
	const expected = JSON.parse(expectedJson.replace(/~/g, samplesFolder));

	const actual = await linguist.analyseFolders([samplesFolder]);
	const diff = updatedDiff(expected, actual);
	if (JSON.stringify(diff) === '{}') {
		console.info('Results match expected');
	}
	else {
		console.dir({ EXPECTED: expected, ACTUAL: actual, DIFFERENCE: diff }, { depth: null });
		throw new Error('Results differ from expected!');
	}
}
testFolder();
