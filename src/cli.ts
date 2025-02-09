const VERSION = require('../package.json').version;

import FS from 'fs';
import Path from 'path';
import { program } from 'commander';

import linguist from './index';
import { normPath } from './helpers/norm-path';

const colouredMsg = ([r, g, b]: number[], msg: string): string => `\u001B[${38};2;${r};${g};${b}m${msg}${'\u001b[0m'}`;
const hexToRgb = (hex: string): number[] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

program
	.name('linguist')
	.usage('--analyze [<folders...>] [<options...>]')

	.option('-a|--analyze|--analyse [folders...]', 'Analyse the languages of all files in a folder')
	.option('-i|--ignoredFiles <files...>', `A list of file path globs to ignore`)
	.option('-l|--ignoredLanguages <languages...>', `A list of languages to ignore`)
	.option('-c|--categories <categories...>', 'Language categories to include in output')
	.option('-C|--childLanguages [bool]', 'Display child languages instead of their parents', false)
	.option('-j|--json [bool]', 'Display the output as JSON', false)
	.option('-t|--tree <traversal>', 'Which part of the output JSON to display (dot-delimited)')
	.option('-F|--listFiles [bool]', 'Whether to list every matching file under the language results', false)
	.option('-m|--minSize <size>', 'Minimum size of file to show language results for (must have a unit: b, kb, mb, %, or loc)')
	.option('-q|--quick [bool]', 'Skip complex language analysis (alias for -{A|I|H|S}=false)', false)
	.option('-o|--offline [bool]', 'Use packaged data files instead of fetching latest from GitHub', false)
	.option('-L|--calculateLines [bool]', 'Calculate lines of code totals', true)
	.option('-V|--keepVendored [bool]', 'Prevent skipping over vendored/generated files', false)
	.option('-B|--keepBinary [bool]', 'Prevent skipping over binary files', false)
	.option('-r|--relativePaths [bool]', 'Convert absolute file paths to relative', false)
	.option('-A|--checkAttributes [bool]', 'Force the checking of gitattributes files', true)
	.option('-I|--checkIgnored [bool]', 'Force the checking of gitignore files', true)
	.option('-D|--checkDetected [bool]', 'Force files marked with linguist-detectable to always appear in output', true)
	.option('-H|--checkHeuristics [bool]', 'Apply heuristics to ambiguous languages', true)
	.option('-S|--checkShebang [bool]', 'Check shebang lines for explicit classification', true)
	.option('-M|--checkModeline [bool]', 'Check modelines for explicit classification', true)

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
	// Check arguments
	const validCategories = ['data', 'programming', 'prose', 'markup'];
	if (args.categories?.some((category: string) => !validCategories.includes(category))) {
		console.log(`Error: '${args.categories.join(', ')}' contains an invalid category. Valid options: ${validCategories.join(', ')}.`);
		return;
	}

	// Fetch language data
	const root = args.analyze === true ? '.' : args.analyze;
	const data = await linguist(root, args);
	const { files, languages, unknown } = data;
	// Print output
	if (!args.json) {
		// Ignore languages with a bytes/% size less than the declared min size
		if (args.minSize) {
			const totalSize = languages.bytes;
			const minSizeAmt = parseFloat(args.minSize.replace(/[a-z]+$/i, '')); // '2KB' -> 2
			const minSizeUnit = args.minSize.replace(/^\d+/, '').toLowerCase(); // '2KB' -> 'kb'
			const checkBytes = minSizeUnit !== 'loc'; // whether to check bytes or loc
			const conversionFactors: Record<string, (n: number) => number> = {
				'b': n => n,
				'kb': n => n * 1e3,
				'mb': n => n * 1e6,
				'%': n => n * totalSize / 100,
				'loc': n => n,
			};
			const minBytesSize = conversionFactors[minSizeUnit](+minSizeAmt);
			const other = { bytes: 0, lines: { total: 0, content: 0, code: 0 } };
			// Apply specified minimums: delete language results that do not reach the threshold
			for (const [lang, data] of Object.entries(languages.results)) {
				const checkUnit = checkBytes ? data.bytes : data.lines.code;
				if (checkUnit < minBytesSize) {
					// Add to 'other' count
					other.bytes += data.bytes;
					other.lines.total += data.lines.total;
					other.lines.content += data.lines.content;
					other.lines.code += data.lines.code;
					// Remove language result
					delete languages.results[lang];
				}
			}
			if (other.bytes) {
				languages.results["Other"] = { ...other, type: null! };
			}
		}

		const sortedEntries = Object.entries(languages.results).sort((a, b) => (a[1].bytes < b[1].bytes ? +1 : -1));
		const totalBytes = languages.bytes;
		console.log(`\n Analysed ${files.bytes.toLocaleString()} B from ${files.count} files with linguist-js`);
		console.log(`\n Language analysis results: \n`);
		let count = 0;
		if (sortedEntries.length === 0) console.log(`  None`);

		// Collate files per language
		const filesPerLanguage: Record<string, string[]> = {};
		if (args.listFiles) {
			for (const language of Object.keys(languages.results)) {
				filesPerLanguage[language] = [];
			}
			for (const [file, lang] of Object.entries(files.results)) {
				if (lang)
					filesPerLanguage[lang].push(file);
			}
		}
		// List parsed results
		for (const [lang, { bytes, lines, color }] of sortedEntries) {
			const percent = (bytes: number) => bytes / (totalBytes || 1) * 100;
			const fmtd = {
				index: (++count).toString().padStart(2, ' '),
				lang: lang.padEnd(24, ' '),
				percent: percent(bytes).toFixed(2).padStart(5, ' '),
				bytes: bytes.toLocaleString().padStart(10, ' '),
				loc: lines.code.toLocaleString().padStart(10, ' '),
				icon: colouredMsg(hexToRgb(color ?? '#ededed'), '\u2588'),
			};
			console.log(`  ${fmtd.index}. ${fmtd.icon} ${fmtd.lang} ${fmtd.percent}% ${fmtd.bytes} B ${fmtd.loc} LOC`);

			// If using `listFiles` option, list all files tagged as this language
			if (args.listFiles) {
				console.log(); // padding
				for (const file of filesPerLanguage[lang]) {
					let relFile = normPath(Path.relative(Path.resolve('.'), file));
					if (!relFile.startsWith('../')) relFile = './' + relFile;
					const bytes = (await FS.promises.stat(file)).size;
					const fmtd2 = {
						file: relFile.padEnd(42, ' '),
						percent: percent(bytes).toFixed(2).padStart(5, ' '),
						bytes: bytes.toLocaleString().padStart(10, ' '),
					}
					console.log(`        ${fmtd.icon} ${fmtd2.file}  ${fmtd2.percent}% ${fmtd2.bytes} B`);
				}
				console.log(); // padding
			}
		}
		if (!args.listFiles) console.log(); // padding
		console.log(` Total: ${totalBytes.toLocaleString()} B`);
		// List unknown files/extensions
		if (unknown.bytes > 0) {
			console.log(`\n Unknown files and extensions:`);
			for (const [name, bytes] of Object.entries(unknown.filenames)) {
				console.log(`  '${name}': ${bytes.toLocaleString()} B`);
			}
			for (const [ext, bytes] of Object.entries(unknown.extensions)) {
				console.log(`  '*${ext}': ${bytes.toLocaleString()} B`);
			}
			console.log(` Total: ${unknown.bytes.toLocaleString()} B`);
		}
	}
	else if (args.tree) {
		const treeParts: string[] = args.tree.split('.');
		let nestedData: Record<string, any> = data;
		for (const part of treeParts) {
			if (!nestedData[part]) throw Error(`TraversalError: Key '${part}' cannot be found on output object.`);
			nestedData = nestedData[part];
		}
		console.log(nestedData);
	}
	else {
		console.dir(data, { depth: null });
	}
})();
else {
	console.log(`Welcome to linguist-js, a JavaScript port of GitHub's language analyzer.`);
	console.log(`Type 'linguist --help' for a list of commands.`);
}
