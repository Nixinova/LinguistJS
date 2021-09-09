import fs from 'fs';
import paths from 'path';

const allFiles = new Set<string>();
const allFolders = new Set<string>();

/** Generate list of files in a directory. */
export default function walk(folder: string | string[], ignored: RegExp[] = []): { files: string[], folders: string[] } {
	if (Array.isArray(folder)) {
		for (const path of folder) walk(path, ignored);
	}
	else {
		const files = fs.readdirSync(folder);
		for (const file of files) {
			const path = paths.resolve(folder, file).replace(/\\/g, '/');
			if (!fs.existsSync(path) || ignored.some(pattern => pattern.test(path))) continue;
			allFolders.add(folder.replace(/\\/g, '/'));
			if (fs.lstatSync(path).isDirectory()) {
				allFolders.add(path)
				walk(path, ignored);
				continue;
			}
			allFiles.add(path);
		}
	}
	return {
		files: [...allFiles],
		folders: [...allFolders],
	};
}
