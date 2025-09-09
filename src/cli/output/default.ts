import { OptionValues } from 'commander';
import FS from 'node:fs';
import Path from 'node:path';
import { normPath } from '../../helpers/norm-path.js';
import { Results } from '../../types.js';
import { colouredMsg, hexToRgb } from '../utils.js';

export default async function defaultOutput(args: OptionValues, data: Results) {
	const { files, languages, unknown, repository } = data;

	if (args.minSize) {
		// Ignore languages with a bytes/% size less than the declared min size

		const totalSize = languages.bytes;
		const minSizeAmt = parseFloat(args.minSize.replace(/[a-z]+$/i, '')); // '2KB' -> 2
		const minSizeUnit = args.minSize.replace(/^\d+/, '').toLowerCase(); // '2KB' -> 'kb'
		const checkBytes = minSizeUnit !== 'loc'; // whether to check bytes or loc
		const conversionFactors: Record<string, (n: number) => number> = {
			['b']: (n) => n,
			['kb']: (n) => n * 1e3,
			['mb']: (n) => n * 1e6,
			['%']: (n) => (n * totalSize) / 100,
			['loc']: (n) => n,
		};
		const minBytesSize = conversionFactors[minSizeUnit](+minSizeAmt);
		const other = { count: 0, bytes: 0, lines: { total: 0, content: 0, code: 0 } };
		// Apply specified minimums: delete language results that do not reach the threshold
		for (const [lang, data] of Object.entries(languages.results)) {
			const checkUnit = checkBytes ? data.bytes : data.lines.content;
			if (checkUnit < minBytesSize) {
				// Add to 'other' count
				other.count++;
				other.bytes += data.bytes;
				other.lines.total += data.lines.total;
				other.lines.content += data.lines.content;
				// Remove language result
				delete languages.results[lang];
			}
		}
		if (other.bytes) {
			languages.results['Other'] = other;
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
			if (lang) {
				filesPerLanguage[lang].push(file);
			}
		}
	}
	// List parsed results
	for (const [lang, { bytes, lines }] of sortedEntries) {
		const colour = hexToRgb(repository[lang].color ?? '#ededed');
		const percent = (bytes: number) => (bytes / (totalBytes || 1)) * 100;
		const fmtd = {
			index: (++count).toString().padStart(2, ' '),
			lang: lang.padEnd(24, ' '),
			percent: percent(bytes).toFixed(2).padStart(5, ' '),
			bytes: bytes.toLocaleString().padStart(10, ' '),
			loc: lines.content.toLocaleString().padStart(10, ' '),
			icon: colouredMsg(colour, '\u2588'),
		};
		console.log(`  ${fmtd.index}. ${fmtd.icon} ${fmtd.lang} ${fmtd.percent}% ${fmtd.bytes} B ${fmtd.loc} LOC`);

		// If using `listFiles` option, list all files tagged as this language
		if (args.listFiles) {
			console.log(); // padding
			for (const file of filesPerLanguage[lang]) {
				let relFile = normPath(Path.relative(Path.resolve('.'), file));
				if (!relFile.startsWith('../')) {
					relFile = './' + relFile;
				}
				const fileStat = await FS.promises.stat(file);
				const bytes = fileStat.size;
				const fmtd2 = {
					file: relFile.padEnd(42, ' '),
					percent: percent(bytes).toFixed(2).padStart(5, ' '),
					bytes: bytes.toLocaleString().padStart(10, ' '),
				};
				console.log(`        ${fmtd.icon} ${fmtd2.file}  ${fmtd2.percent}% ${fmtd2.bytes} B`);
			}
			console.log(); // padding
		}
	}
	if (!args.listFiles) {
		console.log(); // padding
	}
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
