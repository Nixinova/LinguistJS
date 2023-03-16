#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

import loadFile from '../src/helpers/load-data';

async function writeFile(filename: string) {
	const filePath = path.resolve('ext', filename);
	const fileData = await loadFile(filename, false);
	const fileDataMin = fileData
		// Convert /x flag
		.replace(/(\s+|^)#.*/g, '') // remove comments
		.replace(/: \|.*\n((\s+).+\n(\2.+\n)+)/g, (_, content) => `: '${content.replace(/^\s+|\s+$|\r?\n/gm, '')}'\n`) // flatten multi-line data
		.replace('(?x)', '')
	fs.promises.writeFile(filePath, fileDataMin)
		.then(() => console.log(`Successfully wrote ${filename}.`))
		.catch(() => console.log(`Failed to write ${filename}.`))
}

async function downloadFiles() {
	const files = ['languages.yml', 'vendor.yml', 'documentation.yml', 'heuristics.yml', 'generated.rb'];
	if (!fs.existsSync('ext'))
		fs.mkdirSync('ext');
	files.forEach(file => writeFile(file));
}

downloadFiles();
