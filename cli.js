#!/usr/bin/env node

import linguist from './index.js';
import yargs from 'yargs-parser';

const indent = (n) => ' '.repeat(n * 4);
const usage = (cmd, desc) => console.log('\n' + indent(2) + cmd + '\n' + indent(3) + desc.replace(/\n/g, '\n' + indent(4)));

const argOpts = {
	alias: {
		full: ['f'],
		help: ['h'],
		analyse: ['a', 'analyze'],
		vendored: ['v', 'vendor'],
		gitattributes: ['g'],
	},
	boolean: ['full', 'help', 'analyze', 'vendored'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage(`linguist --analyse [<folder>] [--full] [--vendored] [--gitattributes]`, [
		`Analyse the language of all files found in a folder.`,
		`<folder>   		The folder to analyse (optional; default './')`,
		`--full     		List every file parsed (optional)`,
		`--vendored 		Prevent skipping over vendored files (optional)`,
		`--gitattributes 	Check .gitattributes files for custom file associations (optional)`,
	].join('\n'));
}
else if (args.analyse) {
	(async () => {
		const data = await linguist(args._[0], { keepVendored: args.vendored, checkAttributes: args.gitattributes });
		let loggedData = data;
		if (!args.full) delete loggedData.results;
		console.log(loggedData);
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
