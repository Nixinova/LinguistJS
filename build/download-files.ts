import FS from 'fs';
import Path from 'path';
import { loadFile } from '../src/program/data/loadDataFiles.ts';

async function writeFile(filename: string) {
	const filePath = Path.resolve('ext', filename);
	const fileData = await loadFile(filename, false);
	const fileDataMin = fileData
		// Convert /x flag
		.replace(/(\s+|^)#.*/g, '') // remove comments
		.replace(/^\s*$(?:\r?\n|\r)/gm, '') // Remove empty lines
		.replace(/(pattern: )\|.*\n((\s+).+\n(\3.+\n)+)/g, (_, pref, content) => `${pref}'${content.replace(/^\s+|\s+$|\r?\n/gm, '')}'\n`) // flatten multi-line data
		.replace('(?x)', '')
	// Write the file
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
