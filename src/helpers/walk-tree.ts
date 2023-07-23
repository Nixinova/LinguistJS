import fs from 'fs';
import paths from 'path';
import { Ignore } from 'ignore';

let allFiles: Set<string>;
let allFolders: Set<string>;

interface WalkInput {
	/** Whether this is walking the tree from the root */
	init: boolean,
	/** The common root absolute path of all folders being checked */
	commonRoot: string,
	/** The absolute path that each folder is relative to */
	folderRoots: string[],
	/** The absolute path of folders being checked */
	folders: string[],
	gitignores: Ignore,
	regexIgnores: RegExp[],
};
interface WalkOutput {
	files: string[],
	folders: string[],
};

/** Generate list of files in a directory. */
export default function walk(data: WalkInput): WalkOutput {
	const { init, commonRoot, folderRoots, folders, gitignores, regexIgnores } = data;

	// Initialise files and folders lists
	if (init) {
		allFiles = new Set();
		allFolders = new Set();
	}

	// Walk tree of a folder
	if (folders.length === 1) {
		const folder = folders[0];
		const localRoot = folderRoots[0].replace(commonRoot, '').replace(/^\//, '');
		// Get list of files and folders inside this folder
		const files = fs.readdirSync(folder).map(file => {
			// Create path relative to root
			const base = paths.resolve(folder, file).replace(/\\/g, '/').replace(commonRoot, '.');
			// Add trailing slash to mark directories
			const isDir = fs.lstatSync(paths.resolve(commonRoot, base)).isDirectory();
			return isDir ? `${base}/` : base;
		});
		// Loop through files and folders
		for (const file of files) {
			// Create absolute path for disc operations
			const path = paths.resolve(commonRoot, file).replace(/\\/g, '/');
			const localPath = localRoot ? file.replace(`./${localRoot}/`, '') : file.replace('./', '');
			// Skip if nonexistant or ignored
			const nonExistant = !fs.existsSync(path);
			const isGitIgnored = gitignores.test(localPath).ignored;
			const isRegexIgnored = regexIgnores.find(match => localPath.match(match));
			if (nonExistant || isGitIgnored || isRegexIgnored) continue;
			// Add absolute folder path to list
			allFolders.add(paths.resolve(folder).replace(/\\/g, '/'));
			// Check if this is a folder or file
			if (file.endsWith('/')) {
				// Recurse into subfolders
				allFolders.add(path);
				walk({ init: false, commonRoot: commonRoot, folderRoots, folders: [path], gitignores, regexIgnores });
			}
			else {
				// Add file path to list
				allFiles.add(path);
			}
		}
	}
	// Recurse into all folders
	else {
		for (const i in folders) {
			walk({ init: false, commonRoot: commonRoot, folderRoots: [folderRoots[i]], folders: [folders[i]], gitignores, regexIgnores });
		}
	}
	// Return absolute files and folders lists
	return {
		files: [...allFiles].map(file => file.replace(/^\./, commonRoot)),
		folders: [...allFolders],
	};
}
