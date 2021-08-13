import fs from 'fs';
import fetch from 'cross-fetch';
import yaml from 'js-yaml';
import glob from 'tiny-glob';
import glob2regex from 'glob-to-regexp';

import * as T from './types';
import * as S from './schema';

const convertToRegex = (path: string): RegExp => glob2regex('**/' + path, { globstar: true, extended: true });
const last = <T>(arr: T[]): T => arr[arr.length - 1];
const find = (str: string, match: RegExp): string => str.substr(str.search(match));
const dataUrl = (file: string): string => `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}`;
const loadFile = async (file: string) => await fetch(dataUrl(file)).then(data => data.text());

function pcre(regex: string): RegExp {
	let finalRegex = regex;
	let finalFlags = new Set<string>();
	const inlineMatches = regex.matchAll(/\?([a-z]):/g);
	const startMatches = regex.matchAll(/\(\?([a-z]+)\)/g);
	for (const [match, flags] of [...inlineMatches, ...startMatches]) {
		finalRegex = finalRegex.replace(match, '');
		[...flags].forEach(flag => finalFlags.add(flag));
	}
	finalRegex = finalRegex.replace(/([*+]){2}/g, '$1');
	return RegExp(finalRegex, [...finalFlags].join(''));
}

async function readFile(filename: string, onlyFirstLine: boolean = false): Promise<string> {
	const chunkSize = 100;
	const stream = fs.createReadStream(filename, { highWaterMark: chunkSize });
	let content = '';
	for await (const data of stream) {
		content += data.toString();
		if (onlyFirstLine && /\n/.test(content)) return content;
	}
	return content;
}

export = async function analyse(root = '.', opts: T.Options = {}): Promise<T.Results> {
	const langData = <S.LanguagesScema>await loadFile('languages.yml').then(yaml.load);
	const vendorData = <S.VendorSchema>await loadFile('vendor.yml').then(yaml.load);
	const heuristicsData = <S.HeuristicsSchema>await loadFile('heuristics.yml').then(yaml.load);
	const generatedData = await loadFile('generated.rb').then(text => text.match(/(?<=name\.match\(\/).+?(?=(?<!\\)\/\))/gm) ?? []);
	vendorData.push(...generatedData);

	const results: Record<T.FilePath, T.Language[]> = {};
	const finalResults: Record<T.FilePath, T.Language> = {};
	const extensions: Record<T.FilePath, string[]> = {};
	const overrides: Record<T.FilePath, T.Language> = {};
	const languages: T.LanguagesData = {
		all: {},
		programming: {}, markup: {}, data: {}, prose: {},
		unknown: {},
		total: { unique: 0, bytes: 0, unknownBytes: 0 },
	};

	let files = await glob(root + '/**/*', { absolute: true, filesOnly: true, dot: true });
	files = files.map(path => path.replace(/\\/g, '/')).filter(file => !file.includes('/.git/'));
	const folders = new Set(files.map(file => file.replace(/[^/]+$/, '')));

	// Apply aliases
	opts = { checkIgnored: !opts.quick, checkAttributes: !opts.quick, checkHeuristics: !opts.quick, checkShebang: !opts.quick, ...opts };

	// Apply explicit ignores
	if (opts.ignore) {
		const ignoredPaths = opts.ignore.map(path => glob2regex('*' + path + '*', { extended: true }).source);
		vendorData.push(...ignoredPaths);
	}

	// Load gitattributes
	if (!opts.quick) {
		for (const folder of folders) {

			// Skip checks if folder is already ignored
			if (!opts.keepVendored && vendorData.some(path => pcre(path).test(folder))) continue;

			const attributesFile = folder + '.gitattributes';
			const ignoresFile = folder + '.gitignore';

			// Parse gitignores
			if (opts.checkIgnored && fs.existsSync(ignoresFile)) {
				const ignoresData = await readFile(ignoresFile);
				const ignoresList = ignoresData.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
				const ignoredPaths = ignoresList.map(path => glob2regex('*' + path + '*', { extended: true }).source);
				vendorData.push(...ignoredPaths);
			}

			// Parse gitattributes
			if (opts.checkAttributes && fs.existsSync(attributesFile)) {
				const attributesData = await readFile(attributesFile);
				// Custom vendor options
				const vendorMatches = attributesData.matchAll(/^(\S+).*[^-]linguist-(vendored|generated|documentation)(?!=false)/gm);
				for (const [_line, path] of vendorMatches) {
					vendorData.push(folder + convertToRegex(path).source.substr(1));
				}
				// Custom file associations
				const customLangMatches = attributesData.matchAll(/^(\S+).*[^-]linguist-language=(\S+)/gm);
				for (let [_line, path, forcedLang] of customLangMatches) {
					// If specified language is an alias, associate it with its full name
					if (!langData[forcedLang]) {
						const overrideLang = Object.entries(langData).find(entry => entry[1].aliases?.includes(forcedLang.toLowerCase()));
						if (overrideLang) forcedLang = overrideLang[0];
					}
					const fullPath = folder + convertToRegex(path).source.substr(1);
					overrides[fullPath] = forcedLang;
				}
			}

		}
	}
	// Check vendored files
	if (!opts.keepVendored) {
		// Filter out any files that match a vendor file path
		const matcher = (match: string) => pcre(match.replace(/\/$/, '/.+$').replace(/^\.\//, ''));
		files = files.filter(file => !vendorData.some(match => matcher(match).test(file)));
	}

	// Load all files and parse languages
	const addResult = (file: string, data: T.Language) => {
		if (!results[file]) {
			results[file] = [];
			extensions[file] = [];
		}
		results[file].push(data);
		extensions[file].push('.' + last(file.split('.')));
	}
	const overridesArray = Object.entries(overrides);
	for (const file of files) {
		if (fs.lstatSync(file).isDirectory()) continue;
		// Check shebang line for explicit classification
		if (!opts.quick && opts.checkShebang) {
			const firstLine = await readFile(file, true);
			if (firstLine.startsWith('#!')) {
				const matches = Object.entries(langData).filter(([, data]) => data.interpreters?.some(interpreter => firstLine.includes(interpreter)));
				if (matches.length) {
					const forcedLang = matches[0][0];
					addResult(file, forcedLang);
					continue;
				}
			}
		}
		// Check override for manual language classification
		if (!opts.quick && opts.checkAttributes) {
			const match = overridesArray.find(item => RegExp(item[0]).test(file));
			if (match) {
				const forcedLang = match[1];
				addResult(file, forcedLang);
				continue;
			}
		}
		// Search each language
		for (const lang in langData) {
			// Check if filename is a match
			const matchesName = langData[lang].filenames?.some(presetName => file.toLowerCase().endsWith(presetName.toLowerCase()));
			const matchesExt = langData[lang].extensions?.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()));
			if (matchesName || matchesExt) {
				addResult(file, lang);
			}
		}
		// Fallback to null if no language matches
		if (!results[file]) {
			addResult(file, null);
		}
	}

	// Parse heuristics if applicable
	for (const file in results) {
		heuristics:
		for (const heuristics of heuristicsData.disambiguations) {
			// Check heuristic extensions
			for (const ext of extensions[file]) {
				// Make sure the extension matches the current file
				if (!heuristics.extensions.includes(ext)) continue heuristics;
			}
			// Load heuristic rules
			for (const heuristic of heuristics.rules) {
				// Make sure the results includes this language
				if (!results[file].includes(heuristic.language)) continue;
				// Apply heuristics
				if (opts.checkHeuristics) {
					// Normalise heuristic data
					const patterns: string[] = [];
					const normalise = (contents: string | string[]) => patterns.push(...(Array.isArray(contents) ? contents : [contents]));
					if (heuristic.pattern) normalise(heuristic.pattern);
					if (heuristic.named_pattern) normalise(heuristicsData.named_patterns[heuristic.named_pattern]);
					// Check file contents and apply heuristic patterns
					const fileContent = await readFile(file);
					if (patterns.some(pattern => pcre(pattern).test(fileContent))) {
						finalResults[file] = heuristic.language;
						break;
					}
				}
				// Default to final language
				finalResults[file] ??= last(heuristics.rules).language;
			}
		}
	}
	// If no heuristics, load the only language
	for (const file in results) {
		finalResults[file] ??= results[file][0];
	}

	// Load language bytes size
	for (const [file, lang] of Object.entries(finalResults)) {
		if (lang && !langData[lang]) continue;
		// If no language found, add extension in other section
		const fileSize = fs.statSync(file).size;
		if (!lang) {
			const ext = find(file, /(\.[^./]+)?$/);
			languages.unknown[ext] ??= 0;
			languages.unknown[ext] += fileSize;
			languages.total.unknownBytes += fileSize;
			continue;
		}
		// Add language and bytes data to corresponding section
		const { type } = langData[lang];
		languages.all[lang] ??= { type, bytes: 0, color: langData[lang].color };
		languages.all[lang].bytes += fileSize;
		languages[type][lang] ??= 0;
		languages[type][lang] += fileSize;
		languages.total.bytes += fileSize;
	}
	// Load unique language count
	languages.total.unique = Object.values(languages.all).length;
	// Return
	return { count: Object.keys(finalResults).length, results: finalResults, languages };
}
