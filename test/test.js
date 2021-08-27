const linguist = require('..');
const { updatedDiff } = require('deep-object-diff');

async function test() {
	const samplesFolder = __dirname.replace(/\\/g, '/') + '/samples';
	const expected = {
		results: {
			[samplesFolder + '.gitattributes']: 'Git Attributes',
			[samplesFolder + '.gitignore']: 'Ignore List',
			[samplesFolder + '/folder/sub.txt']: 'Text',
			[samplesFolder + '/file.txt']: 'JavaScript',
			[samplesFolder + '/hashbang']: 'JavaScript',
			[samplesFolder + '/Pipfile']: 'TOML',
			[samplesFolder + '/unknown']: null,
		},
		count: 7,
		languages: {
			all: {
				'Git Attributes': { type: 'data', bytes: 71, color: '#F44D27' },
				'Ignore List': { type: 'data', bytes: 29, color: '#000000' },
				JavaScript: { type: 'programming', bytes: 22, color: '#f1e05a' },
				Text: { type: 'prose', bytes: 0, color: undefined },
				TOML: { type: 'data', bytes: 0, color: '#9c4221' }
			},
			programming: { JavaScript: 22 },
			markup: {},
			data: { 'Git Attributes': 71, 'Ignore List': 29, TOML: 0 },
			prose: { Text: 0 },
			unknown: { '': 9 },
			total: { unique: 5, bytes: 122, unknownBytes: 9 }
		},
	}

	const actual = await linguist(samplesFolder);
	const diff = updatedDiff(expected, actual);
	console.log(actual);
	if (JSON.stringify(diff) === '{}') {
		console.info('Results match expected');
	}
	else {
		console.warn('Difference:', diff);
		throw new Error('Results differ from expected!');
	}
}
test();
