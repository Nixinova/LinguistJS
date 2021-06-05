import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import glob from 'glob';

async function loadFile(file) {
	const DATA_URL = `https://raw.githubusercontent.com/github/linguist/HEAD/lib/linguist/${file}.yml`;
	const data = await fetch(DATA_URL).then(data => data.text()).then(yaml.load);
	return data;
}

export default async function analyse(root = '.', opts = {}) {
	const langData = await loadFile('languages');
	const vendorData = await loadFile('vendor');
	const heuristicsData = await loadFile('heuristics');

	const results = {}, extensions = {}, languages = { programming: {}, markup: {}, data: {}, prose: {} };
	let files = glob.sync(root + '/**/*', {});
	if (!opts.keepVendored) {
		// Filter out any files that match a vendor file path
		let matcher = match => new RegExp(match.replace(/\/$/, '/.+$').replace(/^\.\//, ''));
		files = files.filter(file => !vendorData.some(match => file.match(matcher(match))));
	}
	// Load all files and parse languages
	files.forEach(file => {
		// Search each language
		for (const lang in langData) {
			// Check if filename is a match
			const matchesName = langData[lang].filenames?.some(presetName => file === presetName);
			const matchesExt = langData[lang].extensions?.some(ext => file.endsWith(ext));
			if (matchesName || matchesExt) {
				if (!results[file]) {
					results[file] = [];
					extensions[file] = [];
				}
				results[file].push(lang);
				extensions[file].push('.' + file.split('.').slice(-1)[0]);
			}
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
				results[file] = heuristics.rules[[heuristics.rules.length - 1]].language;
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
		const type = langData[lang].type;
		if (!languages[type][lang]) languages[type][lang] = 0;
		languages[type][lang] += fs.statSync(file).size;
	}
	// Return
	return { count: Object.values(results).length, results, languages };
}
