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
		const getFileRegex = line => glob2regex('**/' + line.split(' ')[0], { globstar: true });
		files.forEach(file => folders.add(file.replace(/[^\\/]+$/, '')));
		folders.forEach(folder => {
			let data;
			try { data = fs.readFileSync(folder + '.gitattributes', { encoding: 'utf8' }); } catch { }
			if (!data) return;
			// Custom vendor options
			{
				const match = data.match(/^\S+ .*linguist-(vendored|generated|documentation)(?!=false)/gm) || [];
				match.forEach(line => {
					let filePattern = getFileRegex(line).source;
					vendorData.push(folder + filePattern.substr(1));
				});
			}
			// Custom file associations
			{
				const match = data.match(/^\S+ .*linguist-language=\S+/gm) || [];
				match.forEach(line => {
					let filePattern = getFileRegex(line).source;
					let forcedLang = line.match(/linguist-language=(\S+)/)[1];
					// If specified language is an alias, associate it with its full name
					if (!langData[forcedLang]) {
						for (const [lang, data] of Object.entries(langData)) {
							if (!data.aliases?.includes(forcedLang.toLowerCase())) continue;
							forcedLang = lang;
							break;
						}
					}
					overrides[folder + filePattern.substr(1)] = forcedLang;
				});
			}
		});
	}
	// Check vendored files
	if (!opts.keepVendored) {
		// Filter out any files that match a vendor file path
		let matcher = match => new RegExp(match.replace(/\/$/, '/.+$').replace(/^\.\//, ''));
		files = files.filter(file => !vendorData.some(match => file.match(matcher(match))));
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
	files.forEach(file => {
		// Check override for manual language classification
		if (opts.checkAttributes) {
			let matchIndex = Object.keys(overrides).findIndex(p => file.match(new RegExp(p)));
			if (matchIndex > -1) {
				addResult(file, Object.values(overrides)[matchIndex]);
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
		const fileSize = fs.statSync(file).size;
		languages.total.bytes += fileSize;
		languages[type][lang] += fileSize;
	}
	// Load unique language count
	languages.total.unique = [...Object.keys(languages.programming), ...Object.keys(languages.markup), ...Object.keys(languages.data), ...Object.keys(languages.prose)].length;
	// Return
	return { count: Object.values(results).length, results, languages };
}
