import fs from 'fs';
import paths from 'path';
import glob2regex from 'glob-to-regexp';

const allFiles = new Set<string>();
const allFolders = new Set<string>();

/** Generate list of files in a directory. */
export default function walk(folder: string | string[], ignoredGlobs: string[] = []): { files: string[], folders: string[] } {
	const ignored = ignoredGlobs.map(glob => glob2regex(glob, { extended: true }));
	if (Array.isArray(folder)) {
		for (const path of folder) walk(path, ignoredGlobs);
	}
	else {
		allFolders.add(folder.replace(/\\/g, '/'));
		const files = fs.readdirSync(folder);
		for (const file of files) {
			if (ignored.some(pattern => pattern.test(file))) continue;
			const path = paths.resolve(folder, file);
			if (fs.lstatSync(path).isDirectory()) {
				allFolders.add(path.replace(/\\/g, '/'))
				walk(path);
				continue;
			}
			allFiles.add(path.replace(/\\/g, '/'));
		}
	}
	return {
		files: [...allFiles],
		folders: [...allFolders],
	};
}
