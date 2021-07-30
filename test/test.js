const linguist = require('../dist/index.js');

async function test() {
	const samplesFolder = __dirname.replace(/\\/g, '/') + '/samples';
	const expected = {
		results: {
			[samplesFolder + '/folder/sub.txt']: 'Text',
			[samplesFolder + '/file.txt']: 'JavaScript',
			[samplesFolder + '/Pipfile']: 'TOML',
			[samplesFolder + '/unknown']: null,
		},
		count: 4,
		languages: {
			programming: { JavaScript: 1 },
			markup: {},
			data: { TOML: 0 },
			prose: { Text: 0 },
			total: { unique: 3, bytes: 1 },
		},
	}

	await linguist(samplesFolder).then(actual => {
		const assert = (a, b, msg) => console.assert(a === b, msg, a, b);
		const getResults = obj => Object.entries(obj.results).flat().join(',');
		console.log('Results:', actual);
		assert(getResults(expected), getResults(actual), 'Results');
		assert(expected.count, actual.count, 'Total count');
		assert(expected.languages.programming.JavaScript, actual.languages.programming.JavaScript, 'JavaScript count');
		assert(expected.languages.total.unique, actual.languages.total.unique, 'Total unique');
	});
}
test();
