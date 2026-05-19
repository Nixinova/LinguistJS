import commonPrefix from 'common-path-prefix';
import ignore, { Ignore } from 'ignore';
import FS from 'node:fs';
import Path from 'node:path';
import * as T from '../types/types.js';
import Attributes from './classes/attributes.js';
import { normPath } from './fs/normalisedPath.js';
import readFileChunk from './fs/readFile.js';
import walkTree from './fs/walkTree.js';
import parseGitattributes from './parsing/parseGitattributes.js';

const binaryData = JSON.parse(
	FS.readFileSync(new URL('../../node_modules/binary-extensions/binary-extensions.json', import.meta.url), 'utf-8')
) as string[];

type ProcessFilesResult = {
	files: T.AbsFile[];
	manualAttributes: Attributes;
	relPath(file: T.AbsFile): T.RelFile;
};

export default async function processFiles(
	input: string[],
	opts: T.Options,
	useRawContent: boolean,
	vendorPaths: string[]
): Promise<ProcessFilesResult> {
	// Set a common root path so that vendor paths do not incorrectly match parent folders
	const resolvedInput = input.map((path) => normPath(Path.resolve(path)));
	const commonRoot = (input.length > 1 ? commonPrefix(resolvedInput) : resolvedInput[0]).replace(/\/?$/, '');
	const relPath = (file: T.AbsFile): T.RelFile => (useRawContent ? file : normPath(Path.relative(commonRoot, file)));
	const unRelPath = (file: T.RelFile): T.AbsFile => (useRawContent ? file : normPath(Path.resolve(commonRoot, file)));

	// Other helper functions
	const filterOutIgnored = (files: T.AbsFile[], ignored: Ignore): T.AbsFile[] =>
		ignored.filter(files.map((file) => relPath(file))).map((file) => unRelPath(file));

	//*PREPARE FILES AND DATA*//

	// Prepare list of ignored files
	const ignored = ignore();
	ignored.add('.git/');
	ignored.add(opts.ignoredFiles ?? []);
	const regexIgnores: RegExp[] = opts.keepVendored ? [] : vendorPaths.map((path) => RegExp(path, 'i'));

	// Load file paths and folders
	let files: T.AbsFile[];
	if (useRawContent) {
		// Uses raw file content
		files = input;
	} else {
		// Uses directory on disc
		const data = walkTree({ init: true, commonRoot, folderRoots: resolvedInput, folders: resolvedInput, ignored });
		files = data.files;
	}

	// Fetch and normalise gitattributes data of all subfolders and save to metadata
	const manualAttributes = new Attributes();
	if (!useRawContent && opts.checkAttributes) {
		const nestedAttrFiles = files.filter((file) => file.endsWith('.gitattributes'));
		for (const attrFile of nestedAttrFiles) {
			const relAttrFile = relPath(attrFile);
			const relAttrFolder = Path.dirname(relAttrFile);
			const contents = await readFileChunk(attrFile);
			const parsed = parseGitattributes(contents, relAttrFolder);
			for (const { glob, attrs } of parsed) {
				manualAttributes.add(glob, attrs);
			}
		}
	}

	// Remove files that are linguist-ignored via regex by default unless explicitly unignored in gitattributes
	const filesToIgnore: T.AbsFile[] = [];
	for (const file of files) {
		const relFile = relPath(file);

		const isRegexIgnored = regexIgnores.some((pattern) => pattern.test(relFile));
		if (!isRegexIgnored) {
			// Checking overrides is moot if file is not even marked as ignored by default
			continue;
		}

		const fileAttrs = manualAttributes.findAttrsForPath(relPath(file));
		if (fileAttrs?.generated === false || fileAttrs?.vendored === false) {
			// File is explicitly marked as *not* to be ignored
			// do nothing
		} else {
			filesToIgnore.push(file);
		}
	}
	files = files.filter((file) => !filesToIgnore.includes(file));

	// Apply vendor file path matches and filter out vendored files
	if (!opts.keepVendored) {
		// Get data of files that have been manually marked with metadata
		const vendorTrueGlobs = [
			...manualAttributes.getFlaggedGlobs('vendored', true),
			...manualAttributes.getFlaggedGlobs('generated', true),
			...manualAttributes.getFlaggedGlobs('documentation', true),
		];
		const vendorFalseGlobs = [
			...manualAttributes.getFlaggedGlobs('vendored', false),
			...manualAttributes.getFlaggedGlobs('generated', false),
			...manualAttributes.getFlaggedGlobs('documentation', false),
		];
		// Set up glob ignore object to use for expanding globs to match files
		const vendorTrueIgnore = ignore().add(vendorTrueGlobs);
		const vendorFalseIgnore = ignore().add(vendorFalseGlobs);
		// Remove all files marked as vendored by default
		const excludedFiles = files.filter((file) => vendorPaths.some((pathPtn) => RegExp(pathPtn, 'i').test(relPath(file))));
		files = files.filter((file) => !excludedFiles.includes(file));
		// Re-add removed files that are overridden manually in gitattributes
		const overriddenExcludedFiles = excludedFiles.filter((file) => vendorFalseIgnore.ignores(relPath(file)));
		files.push(...overriddenExcludedFiles);
		// Remove files explicitly marked as vendored in gitattributes
		files = files.filter((file) => !vendorTrueIgnore.ignores(relPath(file)));
	}

	// Filter out binary files
	if (!opts.keepBinary) {
		// Filter out files that are binary by default
		files = files.filter((file) => !binaryData.some((ext) => file.endsWith('.' + ext)));
		// Filter out manually specified binary files
		const binaryIgnored = ignore().add(manualAttributes.getFlaggedGlobs('binary', true));
		files = filterOutIgnored(files, binaryIgnored);
		// Re-add files manually marked not as binary
		const binaryUnignored = ignore().add(manualAttributes.getFlaggedGlobs('binary', false));
		const unignoredList = filterOutIgnored(files, binaryUnignored);
		files.push(...unignoredList);
	}

	return {
		files,
		manualAttributes,
		relPath,
	};
}
