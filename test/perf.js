const linguist = require('..');

async function perfTest() {
	let times = [];
	const run = async () => {
		let t1 = +new Date();
		await linguist('.');
		let t2 = +new Date();
		times.push(t2 - t1);
	}
	let amount = +process.argv[2] || 50;
	for (let i = 0; i < amount; i++) {
		await run();
	}
	let total = times.reduce((arr, val) => arr + val);
	console.log('\n<Performance test results>');
	console.log('Total:', total / 1e3, 'sec', `(n=${amount})`);
	console.log('Average:', total / times.length / 1e3, 'sec');
}
perfTest();
