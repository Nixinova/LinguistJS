import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'js-yaml';
import glob from 'glob';

export default async function analyse(root = '.') {
	const DATA_URL = 'https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml';
	const data = await fetch(DATA_URL).then(data => data.text()).then(yaml.load);

	// Load all files and parse langugaes
	const results = {}, languages = { programming: {}, markup: {}, data: {}, prose: {} };
	const files = glob.sync(root + '/**/*', {});
	files.forEach(file => {
		// Search each language
		for (const lang in data) {
			// Check if filename is a match
			const matchesName = data[lang].filenames?.some(presetName => file === presetName);
			const matchesExt = data[lang].extensions?.some(ext => file.endsWith(ext));
			const matchesVendor = false; // vendor checking not yet implemented
			if ((matchesName || matchesExt) && !matchesVendor) {
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
		const type = data[lang].type;
		if (!languages[type][lang]) languages[type][lang] = 0;
		languages[type][lang] += fs.statSync(file).size;

	}
	return { count: Object.values(results).length, results, languages };
}
