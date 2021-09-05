const VERSION = require('../package.json').version;

import path from 'path';
import { program } from 'commander';

import linguist from './index';

program
	.name('linguist --analyze')
	.usage('[<folder>] [<options...>]')

	.option('-a|--analyze|--analyse [folders...]', 'Analyse the language of all files found in a folder')
	.option('-i|--ignoredFiles <files...>', `A list of file path globs to ignore`)
	.option('-l|--ignoredLanguages <languages...>', `A list of languages to ignore`)
	.option('-c|--categories <categories...>', 'Language categories to include in output')
	.option('-t|--tree <traversal>', 'Which part of the output object (dot-delimited) to display')
	.option('-j|--json [bool]', 'Display the output as JSON', false)
	.option('-q|--quick [bool]', 'Skip checking of gitattributes/gitignore files (alias for -{A|I|H|S}=false)', false)
	.option('-V|--keepVendored [bool]', 'Prevent skipping over vendored/generated files', false)
	.option('-B|--keepBinary [bool]', 'Prevent skipping over binary files', false)
	.option('-A|--checkAttributes [bool]', 'Force the checking of gitattributes files (default: true unless --quick is set)', true)
	.option('-I|--checkIgnored [bool]', 'Force the checking of gitignore files (default: true unless --quick is set)', true)
	.option('-H|--checkHeuristics [bool]', 'Apply heuristics to ambiguous languages (default: true unless --quick is set)', true)
	.option('-S|--checkShebang [bool]', 'Check shebang lines for explicit classification (default: true unless --quick is set)', true)

	.helpOption(`-h|--help`, 'Display this help message')
	.version(VERSION, '-v|--version', 'Display the installed version of linguist-js')

program.parse(process.argv);
const args = program.opts();

// Normalise arguments
for (const arg in args) {
	const normalise = (val: any): any => {
		if (typeof val !== 'string') return val;
		val = val.replace(/^=/, '');
		if (val.match(/true$|false$/)) val = val === 'true';
		return val;
	}
	if (Array.isArray(args[arg])) args[arg] = args[arg].map(normalise);
	else args[arg] = normalise(args[arg]);
}

// Run Linguist
if (args.analyze) (async () => {
	// Fetch language data
	const root = args.analyze === true ? '.' : args.analyze;
	const { files, languages, unknown } = await linguist(root, args);
	// Make file paths relative
	for (const [file, lang] of Object.entries(files.results)) {
		const relFile = file.replace(path.resolve().replace(/\\/g, '/'), '.');
		delete files.results[file];
		files.results[relFile] = lang;
	}
	// Print output
	if (!args.json) {
		const sortedEntries = Object.entries(languages.results).map(([lang, data]) => [lang, data.bytes]).sort((a, b) => a[1] < b[1] ? +1 : -1) as [string, number][];
		const totalBytes = languages.bytes;
		console.log(`Analysed ${files.bytes} B from ${files.count} files with linguist-js`);
		console.log(`\n Language analysis results:`);
		let i = 0;
		for (const [lang, bytes] of sortedEntries) {
			const fmtd = {
				index: (++i).toString().padStart(2, ' '),
				lang: lang.padEnd(24, ' '),
				percent: (bytes / totalBytes * 100).toFixed(2).padStart(5, ' '),
				bytes: bytes.toLocaleString().padStart(10, ' '),
			}
			console.log(`  ${fmtd.index}. ${fmtd.lang} ${fmtd.percent}% ${fmtd.bytes} B`);
		}
		console.log(` Total: ${totalBytes.toLocaleString()} B`);
		if (unknown.bytes > 0) {
			console.log(`\n Unknown files and extensions:`);
			for (const [name, bytes] of Object.entries(unknown.filenames)) {
				console.log(`  '${name}': ${bytes.toLocaleString()} B`);
			}
			for (const [ext, bytes] of Object.entries(unknown.extensions)) {
				console.log(`  '.${ext}': ${bytes.toLocaleString()} B`);
			}
			console.log(` Total: ${unknown.bytes.toLocaleString()} B`)
		}
	}
	else {
		const data = { files, languages, unknown };
		if (args.tree) {
			const treeParts: string[] = args.tree.split('.');
			let nestedData: Record<string, any> = data;
			for (const part of treeParts) nestedData = nestedData[part];
			console.log(nestedData);
		}
		else {
			console.log(JSON.stringify(data, null, 2).replace(/{\s+"type".+?}/sg, obj => obj.replace(/\n\s+/g, ' ')));
		}
	}
})();
else {
	console.log(`Welcome to linguist-js, the JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
