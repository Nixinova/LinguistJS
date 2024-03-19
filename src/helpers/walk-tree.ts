import fs from 'fs';
import paths from 'path';
import ignore, { Ignore } from 'ignore';
import parseGitignore from './parse-gitignore';

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
	/** A list of regexes to ignore */
	regexIgnores: RegExp[],
};

interface WalkOutput {
	files: string[],
	folders: string[],
};

/** Generate list of files in a directory. */
export default function walk(data: WalkInput): WalkOutput {
	const { init, commonRoot, folderRoots, folders, ignored, regexIgnores } = data;

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

		// Read and apply gitignores
		const gitignoreFilename = paths.join(folder, '.gitignore');
		if (fs.existsSync(gitignoreFilename)) {
			const gitignoreContents = fs.readFileSync(gitignoreFilename, 'utf-8');
			const ignoredPaths = parseGitignore(gitignoreContents);
			ignored.add(ignoredPaths);
		}

		// Add gitattributes if present
		const gitattributesPath = paths.join(folder, '.gitattributes');
		if (fs.existsSync(gitattributesPath)) {
			allFiles.add(gitattributesPath);
		}

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
			const isRegexIgnored = regexIgnores.some(pattern => pattern.test(localPath));
			if (isIgnored || isRegexIgnored) continue;

			// Add absolute folder path to list
			allFolders.add(paths.resolve(folder).replace(/\\/g, '/'));
			// Check if this is a folder or file
			if (file.endsWith('/')) {
				// Recurse into subfolders
				allFolders.add(path);
				walk({ init: false, commonRoot, folderRoots, folders: [path], ignored, regexIgnores });
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
			walk({ init: false, commonRoot, folderRoots: [folderRoots[i]], folders: [folders[i]], ignored, regexIgnores });
		}
	}
	// Return absolute files and folders lists
	return {
		files: [...allFiles].map(file => file.replace(/^\./, commonRoot)),
		folders: [...allFolders],
	};
}
