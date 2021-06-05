#!/usr/bin/env node

import linguist from './index.js';

const arg = (n) => process.argv[n + 1] || '';
const indent = (n) => ' '.repeat(n * 4);
const usage = (cmd, desc) => console.log('\n' + indent(2) + cmd.replace(/\n/g, '\n' + indent(2)) + '\n' + indent(3) + desc);

if (/^-*h/.test(arg(1))) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage('linguist --analyze [<folder>]', 'Analyse the language of all files found in a folder');
}
else if (/^-*a/.test(arg(1))) {
	(async () => {
		const { count, languages } = await linguist(arg(2));
		console.log({ count, languages });
	})();
}
else {
    console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
    console.log(`Type 'linguist --help' for a list of commands.`);
}
