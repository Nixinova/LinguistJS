import linguist from './index.js';
import './perf.js';

async function test() {
	const results = ({ count, languages }) => console.log({ count, languages });
	console.log('<Test 1> No arguments:');
	await linguist().then(results);
	console.log('<Test 2> Node modules bin with vendored kept and gitattributes checked:');
	await linguist('./node_modules/.bin', { keepVendored: true, checkAttributes: true }).then(results);
}
test();
