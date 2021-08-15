const VERSION = require('../package.json').version;

import path from 'path';
import { program } from 'commander';

import linguist from './index';
import * as T from './types';

program
	.name('linguist --analyze')
	.usage('[<folder>] [<options...>]')

	.requiredOption('-a|--analyze|--analyse [folder]', 'Analyse the language of all files found in a folder')
	.option('-i|--ignore <files...>', `A list of file path globs to ignore`)
	.option('-f|--files|--full [bool]', 'List every file parsed', false)
	.option('-s|--summary [bool]', 'Show output in a human-readable format', false)
	.option('-q|--quick [bool]', 'Skip checking of gitattributes/gitignore files (alias for -AIHS=false)', false)
	.option('-V|--keepVendored [bool]', 'Prevent skipping over vendored/generated files', false)
	.option('-B|--keepBinary [bool]', 'Prevent skipping over binary files', false)
	.option('-A|--checkAttributes [bool]', 'Force the checking of gitattributes files (default: true unless --quick is set)', true)
	.option('-I|--checkIgnored [bool]', 'Force the checking of gitignore files (default: true unless --quick is set)', true)
	.option('-H|--checkHeuristics [bool]', 'Apply heuristics to ambiguous languages (default: true unless --quick is set)', true)
	.option('-S|--checkShebang|--checkHashbang [bool]', 'Check shebang lines for explicit classification (default: true unless --quick is set)', true)

	.helpOption(`-h|--help`, 'Display this help message')
	.version(VERSION, '-v|--version', 'Display the installed version of linguist-js')

program.parse(process.argv);
const args = program.opts();
for (const arg in args) {
	if (typeof args[arg] !== 'string') continue;
	args[arg] = args[arg].replace(/^=/, '');
	if (args[arg].match(/true$|false$/)) args[arg] = args[arg] === 'true';
}

if (args.analyze) {
	(async () => {
		const root = args.analyze === true ? '.' : args.analyze;
		if (args.ignore[0].match(/(?<!\\)[:;|]/)) args.ignore = args.ignore[0].split(/(?<!\\)[:;|]/);
		const { count, languages, results } = await linguist(root, args);
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
			const languageData: Partial<T.LanguagesData> = languages;
			delete languageData.all;
			console.log(args.files ? { results: relResults, count, languages: languageData } : { count, languages: languageData });
		}
	})();
}
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
