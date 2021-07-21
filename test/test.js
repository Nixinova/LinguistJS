const linguist = require('../src/index.js');
require('./perf.js');

async function test() {
	const results = ({ count, languages }) => console.log({ count, languages });
	console.log('<Test 1> No arguments:');
	await linguist().then(results);
	console.log('<Test 2> Node modules bin with vendored kept and gitattributes checked:');
	await linguist('./node_modules/.bin', { keepVendored: true, quick: false }).then(results);
}
test();
