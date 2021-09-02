const fs = require('fs');
const linguist = require('..');
const { updatedDiff } = require('deep-object-diff');

async function test() {
	const samplesFolder = __dirname.replace(/\\/g, '/') + '/samples';
	const expectedJson = fs.readFileSync(__dirname + '/expected.json', { encoding: 'utf8' });
	const expected = JSON.parse(expectedJson.replace(/\*/g, samplesFolder));

	const actual = await linguist(samplesFolder);
	const diff = updatedDiff(expected, actual);
	console.log(JSON.stringify(actual, null, 2));
	if (JSON.stringify(diff) === '{}') {
		console.info('Results match expected');
	}
	else {
		console.warn('Difference:', JSON.stringify(diff, null, 2));
		throw new Error('Results differ from expected!');
	}
}
test();
