import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import glob from 'glob';
import glob2regex from 'glob-to-regexp';

async function loadFile(file) {
	const DATA_URL = `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}.yml`;
	const data = await fetch(DATA_URL).then(data => data.text()).then(yaml.load);
	return data;
}

export default async function analyse(root = '.', opts = {}) {
	const langData = await loadFile('languages');
	const vendorData = await loadFile('vendor');
	const heuristicsData = await loadFile('heuristics');

	const results = {};
	const extensions = {};
	const overrides = {};
	const languages = { programming: {}, markup: {}, data: {}, prose: {}, total: { unique: 0, bytes: 0 } };

	let files = glob.sync(root + '/**/*', {});
	let folders = new Set();
	// Load gitattributes
	if (opts.checkAttributes) {
		const convertToRegex = path => glob2regex('**/' + path, { globstar: true });
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
			{
				const customLangMatches = data.matchAll(/^(\S+).*[^-]linguist-language=(\S+)/gm);
				const langDataArray = Object.entries(langData);
				for (let [line, path, forcedLang] of customLangMatches) {
					// If specified language is an alias, associate it with its full name
					if (!langData[forcedLang]) {
						for (const [lang, data] of langDataArray) {
							if (!data.aliases?.includes(forcedLang.toLowerCase())) continue;
							forcedLang = lang;
							break;
						}
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
		const matcher = match => new RegExp(match.replace(/\/$/, '/.+$').replace(/^\.\//, ''));
		files = files.filter(file => !vendorData.some(match => matcher(match).test(file)));
	}
	// Load all files and parse languages
	const addResult = (file, data) => {
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
		if (opts.checkAttributes) {
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
			const matchesName = langData[lang].filenames?.some(presetName => file === presetName);
			const matchesExt = langData[lang].extensions?.some(ext => file.endsWith(ext));
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
				results[file] = heuristics.rules[heuristics.rules.length - 1].language;
			}
		}
	}
	// If no heuristics, load the only language
	for (const file in results) {
		if (typeof results[file] === 'string') continue;
		results[file] = results[file][0];
	}
	// Load language bytes size
	for (const [file, lang] of Object.entries(results)) {
		if (!langData[lang]) continue;
		const type = langData[lang].type;
		if (!languages[type][lang]) languages[type][lang] = 0;
		const fileSize = fs.statSync(file).size;
		languages.total.bytes += fileSize;
		languages[type][lang] += fileSize;
	}
	// Load unique language count
	languages.total.unique = [languages.programming, languages.markup, languages.data, languages.prose].flat().length;
	// Return
	return { count: Object.keys(results).length, results, languages };
}
