const linguist = require('..');
const deepEqual = require('fast-deep-equal');

async function test() {
	const samplesFolder = __dirname.replace(/\\/g, '/') + '/samples';
	const expected = {
		results: {
			[samplesFolder + '/folder/sub.txt']: 'Text',
			[samplesFolder + '/file.txt']: 'JavaScript',
			[samplesFolder + '/hashbang']: 'JavaScript',
			[samplesFolder + '/Pipfile']: 'TOML',
			[samplesFolder + '/unknown']: null,
		},
		count: 5,
		languages: {
			all: {
				JavaScript: { type: 'programming', bytes: 22, color: '#f1e05a' },
				Text: { type: 'prose', bytes: 0, color: undefined },
				TOML: { type: 'data', bytes: 0, color: '#9c4221' }
			},
			programming: { JavaScript: 22 },
			markup: {},
			data: { TOML: 0 },
			prose: { Text: 0 },
			unknown: { '': 9 },
			total: { unique: 3, bytes: 22, unknownBytes: 9 },
		},
	}

	await linguist(samplesFolder).then(actual => {
		console.log('Results:', actual);
		console.log('Language data:', actual.languages.all, '\n');
		if (!deepEqual(expected, actual)) {
			console.warn('Results:', '\nexpected:', expected, '\nactual:', actual);
			throw new Error('Results differ from expected!');
		}
	});
}
test();
