const fs = require('fs');
const linguist = require('..');
const { updatedDiff } = require('deep-object-diff');

async function testFolder() {
	console.info('Folder test\n' + '-'.repeat(11));
	const samplesFolder = __dirname.replace(/\\/g, '/') + '/samples';
	const expectedJson = fs.readFileSync(__dirname + '/expected.json', { encoding: 'utf8' });
	const expected = JSON.parse(expectedJson.replace(/~/g, samplesFolder));

	const actual = await linguist(samplesFolder);
	const diff = updatedDiff(expected, actual);
	console.dir(actual, { depth: null });
	if (JSON.stringify(diff) === '{}') {
		console.info('Results match expected');
	}
	else {
		console.dir({ EXPECTED: expected, ACTUAL: actual, DIFFERENCE: diff }, { depth: null });
		throw new Error('Results differ from expected!');
	}
}
testFolder();
