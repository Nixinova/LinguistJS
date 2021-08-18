const VERSION = require('../package.json').version;

import path from 'path';
import { program } from 'commander';

import linguist from './index';
import * as S from './schema';

program
	.name('linguist --analyze')
	.usage('[<folder>] [<options...>]')

	.requiredOption('-a|--analyze|--analyse [folder]', 'Analyse the language of all files found in a folder')
	.option('-i|--ignore <files...>', `A list of file path globs to ignore`)
	.option('-f|--files|--full [bool]', 'List every file parsed', false)
	.option('-c|--categories <categories...>', 'Language categories to include in output')
	.option('-s|--summary [bool]', 'Show output in a human-readable format', false)
	.option('-q|--quick [bool]', 'Skip checking of gitattributes/gitignore files (alias for -{A|I|H|S}=false)', false)
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

// Normalise arguments
for (const arg in args) {
	if (typeof args[arg] !== 'string') continue;
	args[arg] = args[arg].replace(/^=/, '');
	if (args[arg].match(/true$|false$/)) args[arg] = args[arg] === 'true';
}

// Run Linguist
if (args.analyze) (async () => {
	const root = args.analyze === true ? '.' : args.analyze;
	const categories = ['data', 'markup', 'programming', 'prose'];

	// Normalise array arguments
	if (args.ignore?.[0].match(/(?<!\\)[:;|]/)) args.ignore = args.ignore[0].split(/(?<!\\)[:;|]/);
	if (args.categories?.length === 1) args.categories = args.categories[0].split(',');

	// Fetch language data
	const { count, languages, results } = await linguist(root, args);

	// Make file paths relative
	for (const [file, lang] of Object.entries(results)) {
		const relFile = file.replace(path.resolve(root).replace(/\\/g, '/'), '.');
		results[relFile] = lang;
		delete results[file];
	}
	// Filter out languages not part of the specified categories
	for (const type of categories.filter(type => !args.categories.includes(type))) {
		for (const [file, lang] of Object.entries(results)) {
			if (!lang) continue;
			if (lang in languages[type as S.LanguageType]) {
				if (languages.all[lang]) languages.total.bytes -= languages.all[lang].bytes;
				delete results[file];
				delete languages.all[lang];
			}
		}
		delete languages[type as S.LanguageType];
	}
	// Print output
	if (args.summary) {
		const sortedEntries = Object.entries(languages.all).map(([lang, data]) => [lang, data.bytes]).sort((a, b) => a[1] < b[1] ? +1 : -1) as [string, number][];
		const totalBytes = languages.total.bytes;
		console.log(`Languages summary:`);
		for (const [lang, bytes] of sortedEntries) {
			const percent = (bytes / totalBytes * 100).toFixed(2).toString().padStart(5, '0');
			console.log(`- ${percent}% ${lang}`);
		}
		console.log(`Total: ${totalBytes.toLocaleString()} bytes`);
	}
	else {
		languages.all = {};
		console.log(args.files ? { results, count, languages } : { count, languages });
	}
})();
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
