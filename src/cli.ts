const VERSION = require('../package.json').version;

import linguist from './index.js';
import yargs from 'yargs-parser';

import * as T from './types';

const indent = (n: number) => ' '.repeat(n * 4);
const usage = (cmd: string, desc: string) => console.log('\n' + indent(2) + cmd + '\n' + indent(3) + desc.replace(/\n/g, '\n' + indent(4)));

const argOpts = {
	alias: {
		help: ['h'],
		version: ['v'],
		analyse: ['a', 'analyze'],
		ignore: ['i'],
		files: ['f', 'full'],
		quick: ['q'],
		keepVendored: ['V', 'vendor', 'vendored'],
		checkAttributes: ['A'],
		checkIgnored: ['I'],
	},
	boolean: ['help', 'version', 'analyse', 'files', 'quick', 'keepVendored', 'checkAttributes', 'checkIgnored'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage(`linguist --analyse [<folder>] [<...options>]`, [
		`Analyse the language of all files found in a folder.`,
		`<folder>`, `\tThe folder to analyse (optional; default './')`,
		`-i|--ignore`, `\tA list of file path globs (delimited with ':', ';' or '|') to ignore (optional).`,
		`-f|--files`, `\tList every file parsed (optional)`,
		`-V|--keepVendored`, `\tPrevent skipping over vendored/generated files (optional)`,
		`-q|--quick`, `\tSkip checking of gitattributes/gitignore files (optional)`, `\tAlias for -A=false -I=false`,
		`-A|--checkAttributes`, `\tForce the checking of gitattributes files (optional; use alongside --quick to overwrite)`,
		`-I|--checkIgnored`, `\tForce the checking of gitignore files (optional; use alongside --quick to overwrite)`,
	].join('\n'));
	usage(`linguist --version`, 'Display the installed version of linguist-js');
	usage(`linguist --help`, 'Display this help message');
}
else if (args.version) {
	console.log(`The latest version of linguist-js is ${VERSION}.`);
}
else if (args.analyse) {
	(async () => {
		const opts: T.Options = {};
		if (args.ignore) opts.ignore = args.ignore?.split(/(?<!\\)[:;|]/);
		if (args.v) opts.keepVendored = args.v;
		if (args.q) opts.quick = args.q;
		if (args.A) opts.checkAttributes = args.A;
		if (args.I) opts.checkIgnored = args.I;
		const data = await linguist(args._[0], opts);
		const { count, languages, results } = data;
		console.log(args.full ? { results, count, languages } : { count, languages });
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
