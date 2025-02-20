import FS from 'node:fs';
import Path from 'node:path';
import { Ignore } from 'ignore';
import parseGitignore from './parse-gitignore.js';
import { normPath, normAbsPath } from './norm-path.js';

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
		const files = FS.readdirSync(folder).map(file => {
			// Create path relative to root
			const base = normAbsPath(folder, file).replace(commonRoot, '.');
			// Add trailing slash to mark directories
			const isDir = FS.lstatSync(Path.resolve(commonRoot, base)).isDirectory();
			return isDir ? `${base}/` : base;
		});

		// Read and apply gitignores
		const gitignoreFilename = normPath(folder, '.gitignore');
		if (FS.existsSync(gitignoreFilename)) {
			const gitignoreContents = FS.readFileSync(gitignoreFilename, 'utf-8');
			const ignoredPaths = parseGitignore(gitignoreContents);
			const rootRelIgnoredPaths = ignoredPaths.map(ignorePath =>
				// get absolute path of the ignore glob
				normPath(folder, ignorePath)
					// convert abs ignore glob to be relative to the root folder
					.replace(commonRoot + '/', '')
			);
			ignored.add(rootRelIgnoredPaths);
		}

		// Add gitattributes if present
		const gitattributesPath = normPath(folder, '.gitattributes');
		if (FS.existsSync(gitattributesPath)) {
			allFiles.add(gitattributesPath);
		}

		// Loop through files and folders
		for (const file of files) {
			// Create absolute path for disc operations
			const path = normAbsPath(commonRoot, file);
			const localPath = localRoot ? file.replace(`./${localRoot}/`, '') : file.replace('./', '');

			// Skip if nonexistant
			const nonExistant = !FS.existsSync(path);
			if (nonExistant) continue;
			// Skip if marked in gitignore
			const isIgnored = ignored.test(localPath).ignored;
			if (isIgnored) continue;

			// Add absolute folder path to list
			allFolders.add(normAbsPath(folder));
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
