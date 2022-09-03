#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

import loadFile from '../src/helpers/load-data';

async function writeFile(filename: string) {
	const filePath = path.resolve('ext', filename);
	const fileData = await loadFile(filename, false);
	const fileContent = fileData.replace(/(\s+|^)#.*/g, '').replace(/\s+\n/g, '');
	fs.promises.writeFile(filePath, fileContent)
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
