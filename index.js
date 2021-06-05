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

	// Load all files and parse langugaes
	const results = {}, languages = { programming: {}, markup: {}, data: {}, prose: {} };
	const files = glob.sync(root + '/**/*', {});
	files.forEach(file => {
		// Search each language
		for (const lang in langData) {
			// Check if filename is a match
			if (!opts.keepVendored) {
				const matchesVendor = vendorData.some(match => file.match(new RegExp(match)));
				if (matchesVendor) continue;
			}
			const matchesName = langData[lang].filenames?.some(presetName => file === presetName);
			const matchesExt = langData[lang].extensions?.some(ext => file.endsWith(ext));
			if (matchesName || matchesExt) {
				if (!results[file]) results[file] = [];
				results[file].push(lang);
			}
		}
	});
	{ // heuristic checking not yet implemented
		for (const file in results) {
			results[file] = results[file][results[file].length - 1];
		}
	}
	for (const [file, lang] of Object.entries(results)) {
		//if (langs.length > 1) {}
		const type = langData[lang].type;
		if (!languages[type][lang]) languages[type][lang] = 0;
		languages[type][lang] += fs.statSync(file).size;

	}
	return { count: Object.values(results).length, results, languages };
}
