import fs from 'fs';
import paths from 'path';
import { Ignore } from 'ignore';

let allFiles: Set<string>;
let allFolders: Set<string>;

/** Generate list of files in a directory. */
export default function walk(init: boolean, root: string, folders: string[], gitignores: Ignore, regexIgnores: RegExp[]): { files: string[], folders: string[] } {

	// Initialise files and folders lists
	if (init) {
		allFiles = new Set();
		allFolders = new Set();
	}

	// Walk tree of a folder
	if (folders.length === 1) {
		const folder = folders[0];
		// Get list of files and folders inside this folder
		const files = fs.readdirSync(folder).map(file => {
			// Create path relative to root
			const base = paths.resolve(folder, file).replace(/\\/g, '/').replace(root, '.');
			// Add trailing slash to mark directories
			const isDir = fs.lstatSync(paths.resolve(root, base)).isDirectory();
			return isDir ? `${base}/` : base;
		});
		// Loop through files and folders
		for (const file of files) {
			// Create absolute path for disc operations
			const path = paths.resolve(root, file).replace(/\\/g, '/');
			// Skip if nonexistant or ignored
			const nonExistant = !fs.existsSync(path);
			const isGitIgnored = gitignores.test(file.replace('./', '')).ignored;
			const isRegexIgnored = regexIgnores.find(match => file.replace('./', '').match(match));
			if (nonExistant || isGitIgnored || isRegexIgnored) continue;
			// Add absolute folder path to list
			allFolders.add(paths.resolve(folder).replace(/\\/g, '/'));
			// Check if this is a folder or file
			if (file.endsWith('/')) {
				// Recurse into subfolders
				allFolders.add(path);
				walk(false, root, [path], gitignores, regexIgnores);
			}
			else {
				// Add relative file path to list
				allFiles.add(path);
			}
		}
	}
	// Recurse into all folders
	else {
		for (const path of folders) {
			walk(false, root, [path], gitignores, regexIgnores);
		}
	}
	// Return absolute files and folders lists
	return {
		files: [...allFiles].map(file => file.replace(/^\./, root)),
		folders: [...allFolders],
	};
}
