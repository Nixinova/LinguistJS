const VERSION = require('../package.json').version;

import path from 'path';
import yargs from 'yargs-parser';

import linguist from './index';
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
		summary: ['s'],
		quick: ['q'],
		keepVendored: ['V', 'vendor', 'vendored'],
		checkAttributes: ['A'],
		checkIgnored: ['I'],
		checkHeuristics: ['H'],
	},
	boolean: ['help', 'version', 'analyse', 'files', 'summary', 'quick', 'keepVendored', 'checkAttributes', 'checkIgnored', 'checkHeuristics'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
	console.log(`\n${indent(1)}linguist usage:`);
	usage(`linguist --analyse [<folder>] [<...options>]`, [
		`Analyse the language of all files found in a folder.`,
		`<folder>`, `\tThe folder to analyse (optional; default './')`,
		`-i|--ignore`, `\tA list of file path globs (delimited with ':', ';' or '|') to ignore (optional).`,
		`-f|--files`, `\tList every file parsed (optional)`,
		`-s|--summary`, `\tShow output in a human-readable format (optional)`,
		`-q|--quick`, `\tSkip checking of gitattributes/gitignore files (optional)`, `\tAlias for -AIH=false`,
		`-V|--keepVendored`, `\tPrevent skipping over vendored/generated files (optional)`,
		`-A|--checkAttributes`, `\tForce the checking of gitattributes files (optional; use alongside --quick to overwrite)`,
		`-I|--checkIgnored`, `\tForce the checking of gitignore files (optional; use alongside --quick to overwrite)`,
		`-H|--checkHeuristics`, `\tApply heuristics to ambiguous languages (optional; use alongside --quick to overwrite)`,
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
		if (args.q) opts.quick = args.q;
		if (args.v) opts.keepVendored = args.v;
		if (args.A) opts.checkAttributes = args.A;
		if (args.I) opts.checkIgnored = args.I;
		if (args.H) opts.checkHeuristics = args.H;

		const root = args._[0] ?? '.';
		const { count, languages, results } = await linguist(root, opts);
		if (args.summary) {
			const { data, markup, programming, prose, total: { bytes: totalBytes } } = languages;
			const languageData = { data, markup, programming, prose };
			const languageValues = Object.values(languageData).reduce((obj, val) => Object.assign(obj, val));
			const sortedEntries = Object.entries(languageValues).sort((a, b) => a[1] < b[1] ? +1 : -1);
			console.log(`Languages summary:`);
			for (const [lang, bytes] of sortedEntries) {
				const percent = (bytes / totalBytes * 100).toFixed(2).toString().padStart(5, '0');
				console.log(`- ${percent}% ${lang}`);
			}
			console.log(`Total: ${totalBytes.toLocaleString()} bytes`);
		}
		else {
			const relResults: Record<T.FilePath, T.Language> = {};
			for (const [file, lang] of Object.entries(results)) {
				const relFile = file.replace(path.resolve(root).replace(/\\/g, '/'), '.');
				relResults[relFile] = lang;
			}
			console.log(args.files ? { results: relResults, count, languages } : { count, languages });
		}
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
