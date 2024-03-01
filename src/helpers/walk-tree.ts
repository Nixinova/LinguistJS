import fs from 'fs';
import paths from 'path';
import ignore, { Ignore } from 'ignore';

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
	/** An instantiated Ignore object listing ignored files */
	ignored: Ignore,
};

interface WalkOutput {
	files: string[],
	folders: string[],
};

/** Generate list of files in a directory. */
export default function walk(data: WalkInput): WalkOutput {
	const { init, commonRoot, folderRoots, folders, ignored } = data;

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

			// Skip if nonexistant
			const nonExistant = !fs.existsSync(path);
			if (nonExistant) continue;
			// Skip if marked as ignored
			const isIgnored = ignored.test(localPath).ignored;
			if (isIgnored) continue;

			// Add absolute folder path to list
			allFolders.add(paths.resolve(folder).replace(/\\/g, '/'));
			// Check if this is a folder or file
			if (file.endsWith('/')) {
				// Recurse into subfolders
				allFolders.add(path);
				walk({ init: false, commonRoot, folderRoots, folders: [path], ignored });
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
			walk({ init: false, commonRoot, folderRoots: [folderRoots[i]], folders: [folders[i]], ignored });
		}
	}
	// Return absolute files and folders lists
	return {
		files: [...allFiles].map(file => file.replace(/^\./, commonRoot)),
		folders: [...allFolders],
	};
}
