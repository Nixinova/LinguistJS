import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import glob from 'glob';
import glob2regex from 'glob-to-regexp';

import * as T from './types';
import * as S from './schema';

async function loadFile(file: string): Promise<any> {
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
	const languages: T.LanguagesData = { programming: {}, markup: {}, data: {}, prose: {}, total: { unique: 0, bytes: 0 } };

	let files = glob.sync(root + '/**/*', {});
	let folders = new Set();
	// Load gitattributes
	if (!opts.quick) {
		const convertToRegex = (path: string): RegExp => glob2regex('**/' + path, { globstar: true });
		for (const file of files) {
			folders.add(file.replace(/[^\\/]+$/, ''));
		}
		for (const folder of folders) {
			// Attempt to read gitattributes
			let data = '';
			try { data = fs.readFileSync(folder + '.gitattributes', { encoding: 'utf8' }); }
			catch { continue; }
			// Custom vendor options
			const vendorMatches = data.matchAll(/^(\S+).*[^-]linguist-(vendored|generated|documentation)(?!=false)/gm);
			for (const [line, path] of vendorMatches) {
				vendorData.push(folder + convertToRegex(path).source.substr(1));
			}
			// Custom file associations
			const customLangMatches = data.matchAll(/^(\S+).*[^-]linguist-language=(\S+)/gm);
			for (let [line, path, forcedLang] of customLangMatches) {
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
		}
	}
	// Check vendored files
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
		extensions[file].push('.' + file.split('.').slice(-1)[0]);
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
				finalResults[file] = heuristics.rules[heuristics.rules.length - 1].language;
			}
		}
	}
	// If no heuristics, load the only language
	for (const file in results) {
		finalResults[file] ??= results[file][0];
	}
	// Load language bytes size
	for (const [file, lang] of Object.entries(finalResults)) {
		if (!lang || !langData[lang]) continue;
		const type = langData[lang].type;
		if (!languages[type][lang]) languages[type][lang] = 0;
		const fileSize = fs.statSync(file).size;
		languages.total.bytes += fileSize;
		languages[type][lang] += fileSize;
	}
	// Load unique language count
	languages.total.unique = [languages.programming, languages.markup, languages.data, languages.prose].flat().length;
	// Return
	return { count: Object.keys(finalResults).length, results: finalResults, languages };
}
