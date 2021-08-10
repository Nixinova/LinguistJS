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
	.option('-f|--files|--full', 'List every file parsed', false)
	.option('-s|--summary', 'Show output in a human-readable format', false)
	.option('-q|--quick', 'Skip checking of gitattributes/gitignore files (alias for -AIH=false)', false)
	.option('-V|--keepVendored', 'Prevent skipping over vendored/generated files', false)
	.option('-A|--checkAttributes', 'Force the checking of gitattributes files (default: true unless --quick is set)')
	.option('-I|--checkIgnored', 'Force the checking of gitignore files (default: true unless --quick is set)')
	.option('-H|--checkHeuristics', 'Apply heuristics to ambiguous languages (default: true unless --quick is set)')

	.helpOption(`-h|--help`, 'Display this help message')
	.version(VERSION, '-v|--version', 'Display the installed version of linguist-js')

program.parse(process.argv);
const args = program.opts();

if (args.analyze) {
	(async () => {
		const root = args.analyze === true ? '.' : args.analyze;
		if (typeof args.ignore === 'string') args.ignore = args.ignore.split(/(?<!\\)[:;|]/);
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
