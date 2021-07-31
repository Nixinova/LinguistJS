import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import glob from 'glob';
import glob2regex from 'glob-to-regexp';

import * as T from './types';
import * as S from './schema';

const convertToRegex = (path: string): RegExp => glob2regex('**/' + path, { globstar: true });
const last = <T>(arr: T[]): T => arr[arr.length - 1];

const loadFile = async (file: string): Promise<any> => {
	const DATA_URL = `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}.yml`;
	const data = await fetch(DATA_URL).then(data => data.text()).then(yaml.load);
	return data;
}

export = async function analyse(root = '.', opts: T.Options = {}) {
	const langData = <S.LanguagesScema>await loadFile('languages');
	const vendorData = <S.VendorSchema>await loadFile('vendor');
	const heuristicsData = <S.HeuristicsSchema>await loadFile('heuristics');

	const results: Record<T.FilePath, T.Language[]> = {};
	const finalResults: Record<T.FilePath, T.Language> = {};
	const extensions: Record<T.FilePath, string[]> = {};
	const overrides: Record<T.FilePath, T.Language> = {};
	const languages: T.LanguagesData = { programming: {}, markup: {}, data: {}, prose: {}, unknown: {}, total: { unique: 0, bytes: 0 } };

	const sourceFiles = glob.sync(root + '/**/*', {});
	const folders = new Set<string>();

	// Apply aliases
	opts = { checkIgnored: !opts.quick, checkAttributes: !opts.quick, checkHeuristics: !opts.quick, ...opts };

	// Apply explicit ignores
	if (opts.ignore) vendorData.push(...opts.ignore);

	// Load gitattributes
	if (!opts.quick) {
		for (const file of sourceFiles) {
			folders.add(file.replace(/[^\\/]+$/, ''));
		}
		for (const folder of folders) {

			// Skip checks if folder is already ignored
			if (!opts.keepVendored && vendorData.some(path => RegExp(path).test(folder))) continue;

			// Attempt to read gitignores
			if (opts.checkIgnored) try {
				let ignoresData = fs.readFileSync(folder + '.gitignore', { encoding: 'utf8' }); // may throw
				const ignoredPaths = ignoresData.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
				vendorData.push(...ignoredPaths);
			} catch { }

			// Attempt to read gitattributes
			if (opts.checkAttributes) try {
				let attributesData = fs.readFileSync(folder + '.gitattributes', { encoding: 'utf8' }); // may throw
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
						for (const lang in langData) {
							if (!langData[lang].aliases?.includes(forcedLang.toLowerCase())) continue;
							forcedLang = lang;
							break;
						}
					}
					const fullPath = folder + convertToRegex(path).source.substr(1);
					overrides[fullPath] = forcedLang;
				}
			} catch { }

		}
	}
	// Check vendored files
	let files = [...sourceFiles];
	if (!opts.keepVendored) {
		// Filter out any files that match a vendor file path
		const matcher = (match: string) => new RegExp(match.replace(/\/$/, '/.+$').replace(/^\.\//, ''));
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
	files.forEach(file => {
		if (fs.lstatSync(file).isDirectory()) return;
		// Check override for manual language classification
		if (!opts.quick) {
			const match = overridesArray.find(item => file.match(new RegExp(item[0])));
			if (match) {
				const forcedLang = match[1];
				addResult(file, forcedLang);
				return;
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
	});

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
			for (const { language } of heuristics.rules) {
				// Make sure the results includes this language
				if (!results[file].includes(language)) continue;
				// If the default (final) heuristic is this language, set it
				finalResults[file] = last(heuristics.rules).language;
			}
		}
	}
	// If no heuristics, load the only language
	for (const file in results) {
		finalResults[file] ??= results[file][0];
	}

	// Load language bytes size
	for (const [file, lang] of Object.entries(finalResults)) {
		// If no language found, add extension in other section
		if (!lang) {
			let ext = file.match(/(\.[^./]+)?$/)?.[0] ?? '';
			const fileSize = fs.statSync(file).size;
			languages.unknown[ext] ??= 0;
			languages.unknown[ext] += fileSize;
			continue;
		}
		// Add language and bytes data to corresponding section
		if (!langData[lang]) continue;
		const type = langData[lang].type;
		const fileSize = fs.statSync(file).size;
		languages[type][lang] ??= 0;
		languages[type][lang] += fileSize;
		languages.total.bytes += fileSize;
	}
	// Load unique language count
	languages.total.unique = Object.values({ ...languages.programming, ...languages.markup, ...languages.data, ...languages.prose }).length;
	// Return
	return { count: Object.keys(finalResults).length, results: finalResults, languages };
}
