const linguist = require('..');

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
			programming: { JavaScript: 22 },
			markup: {},
			data: { TOML: 0 },
			prose: { Text: 0 },
			total: { unique: 3, bytes: 22, unknownBytes: 9 },
		},
	}

	await linguist(samplesFolder).then(actual => {
		const assert = (a, b, msg) => console.assert(a === b, msg, [a, b]);
		const getResults = obj => Object.entries(obj.results).sort(([a], [b]) => a < b ? +1 : -1).flat().join(',');
		console.log('Results:', actual);
		console.log('TOML data:', actual.languages.all['TOML'], '\n');
		assert(getResults(expected), getResults(actual), 'Results');
		assert(expected.count, actual.count, 'Total count');
		assert(expected.languages.programming.JavaScript, actual.languages.programming.JavaScript, 'JavaScript count');
		assert(expected.languages.total.unique, actual.languages.total.unique, 'Total unique');
		assert(expected.languages.total.unknownBytes, actual.languages.total.unknownBytes, 'Total unknown bytes');
	});
}
test();
