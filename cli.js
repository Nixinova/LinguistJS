#!/usr/bin/env node

import linguist from './index.js';
import yargs from 'yargs-parser';

const indent = (n) => ' '.repeat(n * 4);
const usage = (cmd, desc) => console.log('\n' + indent(2) + cmd + '\n' + indent(3) + desc.replace(/\n/g, '\n' + indent(4)));

const argOpts = {
	alias: { full: ['f'], help: ['h'], analyse: ['a', 'analyze'] },
	boolean: ['full', 'help'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage(`linguist --analyse [<folder>] [--full]`, [
		`Analyse the language of all files found in a folder.`,
		`<folder>   The folder to analyse (optional; default './')`,
		`--full     List every file parsed (optional)`,
	].join('\n'));
}
else if (args.analyse) {
	(async () => {
		const data = await linguist(args._[0]);
		let loggedData = data;
		if (!args.full) delete loggedData.results;
		console.log(loggedData);
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
