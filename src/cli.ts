const VERSION = require('../package.json').version;

import linguist from './index.js';
import yargs from 'yargs-parser';

import * as T from './types';

const indent = (n: number) => ' '.repeat(n * 4);
const usage = (cmd: string, desc: string) => console.log('\n' + indent(2) + cmd + '\n' + indent(3) + desc.replace(/\n/g, '\n' + indent(4)));

const argOpts = {
	alias: {
		files: ['f', 'full'],
		help: ['h'],
		version: ['v'],
		analyse: ['a', 'analyze'],
		vendored: ['V', 'vendor'],
		quick: ['q'],
	},
	boolean: ['full', 'help', 'version', 'analyze', 'vendored', 'quick'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage(`linguist --analyse [<folder>] [--files] [--vendored] [--gitattributes]`, [
		`Analyse the language of all files found in a folder.`,
		`<folder>`, `\tThe folder to analyse (optional; default './')`,
		`-f|--files`, `\tList every file parsed (optional)`,
		`-V|--vendored`, `\tPrevent skipping over vendored/generated files (optional)`,
		`-q|--quick`, `\tSkip checking of gitattributes files (optional)`,
	].join('\n'));
	usage(`linguist --version`, 'Display the installed version of linguist-js');
	usage(`linguist --help`, 'Display this help message');
}
else if (args.version) {
	console.log(`The latest version of linguist-js is ${VERSION}.`);
}
else if (args.analyse) {
	(async () => {
		const opts = { keepVendored: !!args.vendored, quick: !!args.quick };
		const data = await linguist(args._[0], opts);
		const { count, languages, results } = data;
		console.log(args.full ? { results, count, languages } : { count, languages });
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
