#!/usr/bin/env tsx

import FS from 'node:fs';
import Path from 'node:path';
import YAML from 'js-yaml';

import loadFile, { parseGeneratedDataFile } from '../src/helpers/load-data';

async function writeFile(filename: string) {
	const filePath = Path.resolve('ext', filename);
	const fileData = await loadFile(filename, false);
	let fileDataMin = fileData
		// Convert /x flag
		.replace(/(\s+|^)#.*/g, '') // remove comments
		.replace(/(pattern: )\|.*\n((\s+).+\n(\3.+\n)+)/g, (_, pref, content) => `${pref}'${content.replace(/^\s+|\s+$|\r?\n/gm, '')}'\n`) // flatten multi-line data
		.replace('(?x)', '')
	// Nuke unused `generated.rb` content
	if (filename === 'generated.rb')
		fileDataMin = YAML.dump(await parseGeneratedDataFile(fileDataMin));
	FS.promises.writeFile(filePath, fileDataMin)
		.then(() => console.log(`Successfully wrote ${filename}.`))
		.catch(() => console.log(`Failed to write ${filename}.`))
}

async function downloadFiles() {
	const files = ['languages.yml', 'vendor.yml', 'documentation.yml', 'heuristics.yml', 'generated.rb'];
	if (!FS.existsSync('ext'))
		FS.mkdirSync('ext');
	files.forEach(file => writeFile(file));
}

downloadFiles();
