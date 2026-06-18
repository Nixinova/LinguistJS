import commonPrefix from 'common-path-prefix';
import binaryExtensions from 'binary-extensions';
import ignore from 'ignore';
import FS from 'node:fs';
import Path from 'node:path';
import Attributes from '../program/classes/attributes.js';
import { getFileExtension, normPath } from '../program/fs/normalisedPath.js';
import walkTree from '../program/fs/walkTree.js';
import parseGitattributes from '../program/parsing/parseGitattributes.js';
import * as T from '../types/types.js';

const binaryData = binaryExtensions;

type FileInput = string;

export default async function fromFilesystem(input: FileInput[], opts: T.Options, vendorPaths: string[]): Promise<T.VirtualFile[]> {
	const resolvedInput = input.map((path) => normPath(Path.resolve(path)));
	const commonRoot = (resolvedInput.length > 1 ? commonPrefix(resolvedInput) : resolvedInput[0]).replace(/\/?$/, '');
	const relPath = (file: string): string => normPath(Path.relative(commonRoot, file));

	const ignored = ignore();
	ignored.add('.git/');
	ignored.add(opts.ignoredFiles ?? []);
	const regexIgnores = opts.keepVendored ? [] : vendorPaths.map((path) => RegExp(path, 'i'));

	const directoryInputs = resolvedInput.filter((path) => FS.existsSync(path) && FS.lstatSync(path).isDirectory());
	const fileInputs = resolvedInput.filter((path) => FS.existsSync(path) && !FS.lstatSync(path).isDirectory());

	let files: string[] = [];
	if (directoryInputs.length) {
		const data = walkTree({ init: true, commonRoot, folderRoots: directoryInputs, folders: directoryInputs, ignored });
		files = [...data.files];
	}
	files.push(...fileInputs);
	files = [...new Set(files)];

	// Establish language overrides taken from gitattributes
	const manualAttributes = new Attributes();
	if (opts.checkAttributes) {
		const nestedAttrFiles = files.filter((file) => file.endsWith('.gitattributes'));
		for (const attrFile of nestedAttrFiles) {
			const relAttrFile = relPath(attrFile);
			const relAttrFolder = Path.dirname(relAttrFile);
			const contents = FS.readFileSync(attrFile, 'utf-8');
			const parsed = parseGitattributes(contents, relAttrFolder);
			for (const { glob, attrs } of parsed) {
				manualAttributes.add(glob, attrs);
			}
		}
	}

	const filesToIgnore: string[] = [];
	for (const file of files) {
		const relative = relPath(file);
		const isRegexIgnored = regexIgnores.some((pattern) => pattern.test(relative));
		if (!isRegexIgnored) continue;

		const fileAttrs = manualAttributes.findAttrsForPath(relative);
		if (fileAttrs?.generated === false || fileAttrs?.vendored === false) continue;
		filesToIgnore.push(file);
	}
	files = files.filter((file) => !filesToIgnore.includes(file));

	if (!opts.keepVendored) {
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
		const vendorTrueIgnore = ignore().add(vendorTrueGlobs);
		const vendorFalseIgnore = ignore().add(vendorFalseGlobs);

		const excludedFiles = files.filter((file) => vendorPaths.some((pathPtn) => RegExp(pathPtn, 'i').test(relPath(file))));
		files = files.filter((file) => !excludedFiles.includes(file));
		const overriddenExcludedFiles = excludedFiles.filter((file) => vendorFalseIgnore.ignores(relPath(file)));
		files.push(...overriddenExcludedFiles);
		files = files.filter((file) => !vendorTrueIgnore.ignores(relPath(file)));
	}

	if (!opts.keepBinary) {
		files = files.filter((file) => !binaryData.some((ext) => file.toLowerCase().endsWith(`.${ext}`)));
		const binaryIgnored = ignore().add(manualAttributes.getFlaggedGlobs('binary', true));
		files = files.filter((file) => !binaryIgnored.ignores(relPath(file)));
		const binaryUnignored = ignore().add(manualAttributes.getFlaggedGlobs('binary', false));
		const binaryUnignoredList = files.filter((file) => binaryUnignored.ignores(relPath(file)));
		files.push(...binaryUnignoredList);
	}

	const fileSet = new Set(files);
	const virtualFiles: T.VirtualFile[] = [];
	for (const file of fileSet) {
		if (!FS.existsSync(file) || FS.lstatSync(file).isDirectory()) continue;
		const content = FS.readFileSync(file, 'utf-8');
		const firstLine = content.split(/\r?\n/)[0] ?? '';
		const relative = relPath(file);
		const fileAttrs = manualAttributes.findAttrsForPath(relative);
		const metadata: T.VirtualFile['metadata'] = {};
		if (fileAttrs?.vendored === true) metadata.vendored = true;
		if (fileAttrs?.generated === true) metadata.generated = true;
		if (fileAttrs?.documentation === true) metadata.documentation = true;
		const attributes = fileAttrs
			? {
					language: fileAttrs.language ?? undefined,
					binary: fileAttrs.binary === true ? true : undefined,
					detectable: fileAttrs.detectable === true ? true : undefined,
				}
			: undefined;
		virtualFiles.push({
			path: file,
			content,
			firstLine,
			size: Buffer.byteLength(content, 'utf-8'),
			extension: getFileExtension(file),
			isBinary: fileAttrs?.binary === true || binaryData.some((ext) => file.toLowerCase().endsWith(`.${ext}`)),
			metadata: Object.keys(metadata).length ? metadata : undefined,
			attributes,
		});
	}

	return virtualFiles;
}
