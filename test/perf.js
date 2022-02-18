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
	const unit = 'ms';
	const total = time;
	const average = total / amount;
	const EXPECTED_MAX = 75; // 2.3
	console.log('\n<Performance test results>');
	console.log('Total:', total, unit, `(n=${amount})`);
	console.log('Average:', average, unit);
	if (average > EXPECTED_MAX) console.warn('Warning: average runtime higher than expected');
}
perfTest();
