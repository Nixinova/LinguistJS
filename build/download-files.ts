#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

import loadFile from '../src/helpers/load-data';

async function writeFile(filename: string) {
	const filePath = path.resolve('ext', filename);
	const fileData = await loadFile(filename, false);
	fs.writeFile(filePath, fileData)
		.then(() => console.log(`Successfully wrote ${filename}.`))
		.catch(() => console.log(`Failed to write ${filename}.`))
}

async function downloadFiles() {
	const files = ['languages.yml', 'vendor.yml', 'documentation.yml', 'heuristics.yml', 'generated.rb'];
	files.forEach(file => writeFile(file));
}

downloadFiles();
