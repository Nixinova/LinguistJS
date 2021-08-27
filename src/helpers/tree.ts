import fs from 'fs';
import paths from 'path';
import glob2regex from 'glob-to-regexp';

const allFiles = new Set<string>();
const allFolders = new Set<string>();

/** Generate list of files in a directory. */
export default function walk(folder: string | string[], ignoredGlobs: string[] = []): [string[], string[]] {
	const ignored = ignoredGlobs.map(glob => glob2regex(glob, { extended: true }));
	if (Array.isArray(folder)) {
		folder.map(path => walk(path, ignoredGlobs));
	}
	else for (const file of fs.readdirSync(folder)) {
		if (ignored.some(pattern => pattern.test(file))) continue;
		const path = paths.resolve(folder, file);
		if (fs.lstatSync(path).isDirectory()) {
			allFolders.add(path.replace(/\\/g, '/'))
			walk(path);
			continue;
		}
		allFiles.add(path.replace(/\\/g, '/'));
	}
	return [[...allFiles], [...allFolders]];
}
