const linguist = require('..');

async function perfTest() {
	let time = 0;
	const amount = +process.argv[2] || 75;
	for (let i = 0; i < amount; i++) {
		let t1 = +new Date();
		await linguist('.');
		let t2 = +new Date();
		time += t2 - t1;
	}
	const total = time / 1e3;
	const average = total / amount;
	const EXPECTED_MAX = 0.160; // 1.6
	console.log('\n<Performance test results>');
	console.log('Total:', total, 'sec', `(n=${amount})`);
	console.log('Average:', average, 'sec');
	if (average > EXPECTED_MAX) console.warn('Warning: average runtime higher than expected');
}
perfTest();
